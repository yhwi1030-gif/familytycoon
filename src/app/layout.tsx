import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "패밀리 길드 타이쿤 - 자녀 생활습관 메이커",
  description: "게이미피케이션(Gamification) 요소와 바움린드 양육 이론을 접목하여 자녀의 성실성, 지력, 주도성을 기르는 가족형 타이쿤 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-slate-950 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
