import { RegisterOffline } from "@/components/register-offline";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Noto_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMonoHeading = JetBrains_Mono({subsets:['latin'],variable:'--font-heading'});

const notoSerif = Noto_Serif({subsets:['latin'],variable:'--font-serif'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Buddy",
  description: "출발 준비부터 여행지의 하루까지 먼저 챙겨 주는 여행 친구",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, inter.variable, "font-serif", notoSerif.variable, jetbrainsMonoHeading.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterOffline />
      </body>
    </html>
  );
}
