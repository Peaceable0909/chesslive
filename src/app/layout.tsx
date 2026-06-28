import type { Metadata } from "next";
import { Sora, DM_Sans, Geist } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ChessLive — Play Chess Against Thousands",
  description: "Where every viewer becomes a player. Vote on moves in real-time grandmaster matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${sora.variable} ${dmSans.variable} ${geist.variable} min-h-full bg-[#0D0D1A] text-[#e2e0fc] antialiased`}>
        {children}
      </body>
    </html>
  );
}
