import { RegisterOffline } from "@/components/register-offline";
import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-korean",
});

export const metadata: Metadata = {
  title: "Travel Buddy",
  description: "출발 준비부터 여행지의 하루까지 먼저 챙겨 주는 여행 친구",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", "font-serif", notoSansKr.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterOffline />
      </body>
    </html>
  );
}
