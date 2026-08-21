import type { Metadata } from "next";
import { Noto_Serif_KR, Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const headlineFont = Noto_Serif_KR({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const gaugeFont = JetBrains_Mono({
  variable: "--font-gauge",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "물빛 | 국내외 스노클링 스팟 가이드",
  description:
    "물빛은 국내외 스노클링 스팟을 지역별로 탐색하고, 수심·시야·조류·수온 정보와 커뮤니티 제보를 통해 검증된 포인트를 찾을 수 있는 가이드 서비스입니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${headlineFont.variable} ${bodyFont.variable} ${gaugeFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-navy-deep text-sand">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
