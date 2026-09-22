import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth/context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Parlons — Entraînement au français oral",
  description:
    "Parlez à voix haute avec un avatar en français. Transcription en temps réel et correction de votre orthographe, grammaire et conjugaison, en privé.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${plexSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <LocaleProvider>
          <AuthProvider>
            <Header />
            {children}
            <Footer />
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
