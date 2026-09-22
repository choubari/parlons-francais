import { NextResponse } from "next/server";
import { getEnv } from "@/lib/db/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const env = await getEnv();
  if (!env.AVATARS) return new NextResponse(null, { status: 404 });

  const { key } = await params;
  const obj = await env.AVATARS.get(key.join("/"));
  if (!obj) return new NextResponse(null, { status: 404 });

  return new NextResponse(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType ?? "image/png",
      "cache-control": "public, max-age=3600",
    },
  });
}
