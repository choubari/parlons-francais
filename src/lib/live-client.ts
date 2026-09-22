"use client";

import { GoogleGenAI, Modality, type Session } from "@google/genai";

export type TranscriptTurn = { role: "caller" | "prospect"; text: string };

type Handlers = {
  onTranscript: (turns: TranscriptTurn[]) => void;
  onProspectSpeaking: (speaking: boolean) => void;
  onError: (message: string) => void;
  onClose: () => void;
};

const INPUT_RATE = 16000;
const OUTPUT_RATE = 24000;

function b64ToInt16(b64: string): Int16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function floatToB64Pcm(input: Float32Array): string {
  const pcm = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm.buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Wraps a Gemini Live voice session for the browser: mic capture (16 kHz PCM),
 * streaming playback (24 kHz), live transcripts, and barge-in handling.
 */
export class LiveCall {
  private session: Session | null = null;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  private playHead = 0;
  private activeSources = new Set<AudioBufferSourceNode>();

  private turns: TranscriptTurn[] = [];
  private callerBuf = "";
  private prospectBuf = "";
  private muted = false;
  private closed = false;

  constructor(private h: Handlers) {}

  async start(token: string, model: string): Promise<void> {
    this.outputCtx = new AudioContext({ sampleRate: OUTPUT_RATE });
    this.inputCtx = new AudioContext({ sampleRate: INPUT_RATE });
    // start() is called from a click handler, so resuming here is allowed.
    if (this.outputCtx.state === "suspended") void this.outputCtx.resume();

    // Acquire the mic UP FRONT (inside the user gesture) so a permission
    // problem surfaces immediately instead of hiding behind a socket that
    // never opens.
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true },
      });
    } catch (e) {
      console.error("[live] mic error", e);
      throw new Error("Microphone permission was denied or no mic is available.");
    }

    const ai = new GoogleGenAI({
      apiKey: token,
      httpOptions: { apiVersion: "v1alpha" },
    });

    this.session = await ai.live.connect({
      model,
      // Locked server-side by the ephemeral token; sent to satisfy the SDK.
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => this.startMic(),
        onmessage: (msg) => this.onMessage(msg),
        onerror: (e: unknown) => {
          console.error("[live] socket error", e);
          this.h.onError(e instanceof Error ? e.message : "Live connection error.");
        },
        onclose: (e: unknown) => {
          // A clean end (code 1000) is normal when the user hangs up. Other
          // codes (e.g. 1008 bad model, 1011 token expiry) are logged.
          const ev = e as { code?: number; reason?: string };
          if (ev?.code && ev.code !== 1000) {
            console.warn("[live] socket closed", ev.code, ev.reason);
          }
          this.h.onClose();
        },
      },
    });
  }

  private startMic() {
    if (!this.inputCtx || !this.stream) return;
    if (this.closed) {
      this.stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const ctx = this.inputCtx;
    this.source = ctx.createMediaStreamSource(this.stream);
    this.processor = ctx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (ev) => {
      if (this.muted || !this.session) return;
      const data = ev.inputBuffer.getChannelData(0);
      try {
        this.session.sendRealtimeInput({
          audio: {
            data: floatToB64Pcm(data),
            mimeType: `audio/pcm;rate=${INPUT_RATE}`,
          },
        });
      } catch {
        /* session closing */
      }
    };
    this.source.connect(this.processor);
    this.processor.connect(ctx.destination);
  }

  private onMessage(msg: unknown) {
    const m = msg as {
      serverContent?: {
        modelTurn?: {
          parts?: { inlineData?: { data?: string; mimeType?: string } }[];
        };
        inputTranscription?: { text?: string };
        outputTranscription?: { text?: string };
        interrupted?: boolean;
        turnComplete?: boolean;
      };
    };
    const sc = m.serverContent;

    if (sc?.interrupted) this.stopPlayback();

    // Pull audio directly from inlineData parts (audio/pcm) — robust when the
    // model also emits text/thought parts alongside audio.
    const parts = sc?.modelTurn?.parts ?? [];
    for (const p of parts) {
      const inline = p.inlineData;
      if (
        inline?.data &&
        (inline.mimeType?.startsWith("audio/") ?? true) &&
        this.outputCtx
      ) {
        this.enqueueAudio(inline.data);
        this.h.onProspectSpeaking(true);
      }
    }

    if (sc?.inputTranscription?.text) this.callerBuf += sc.inputTranscription.text;
    if (sc?.outputTranscription?.text)
      this.prospectBuf += sc.outputTranscription.text;

    if (sc?.turnComplete) {
      this.flushTurns();
      this.h.onProspectSpeaking(false);
    }
  }

  private flushTurns() {
    const c = this.callerBuf.trim();
    const p = this.prospectBuf.trim();
    if (c) this.turns.push({ role: "caller", text: c });
    if (p) this.turns.push({ role: "prospect", text: p });
    this.callerBuf = "";
    this.prospectBuf = "";
    if (c || p) this.h.onTranscript([...this.turns]);
  }

  private enqueueAudio(b64: string) {
    const ctx = this.outputCtx!;
    const pcm = b64ToInt16(b64);
    const buf = ctx.createBuffer(1, pcm.length, OUTPUT_RATE);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    const startAt = Math.max(now, this.playHead);
    src.start(startAt);
    this.playHead = startAt + buf.duration;
    this.activeSources.add(src);
    src.onended = () => {
      this.activeSources.delete(src);
      if (this.activeSources.size === 0) this.h.onProspectSpeaking(false);
    };
  }

  private stopPlayback() {
    this.activeSources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    this.activeSources.clear();
    this.playHead = this.outputCtx?.currentTime ?? 0;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  getTranscript(): TranscriptTurn[] {
    this.flushTurns();
    return [...this.turns];
  }

  stop() {
    this.closed = true;
    this.stopPlayback();
    try {
      this.processor?.disconnect();
      this.source?.disconnect();
    } catch {
      /* noop */
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    try {
      this.session?.close();
    } catch {
      /* noop */
    }
    this.closeCtx(this.inputCtx);
    this.closeCtx(this.outputCtx);
    this.inputCtx = null;
    this.outputCtx = null;
    this.session = null;
  }

  private closeCtx(ctx: AudioContext | null) {
    if (!ctx || ctx.state === "closed") return;
    ctx.close().catch(() => {
      /* already closing/closed */
    });
  }
}
