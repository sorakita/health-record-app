import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "体調管理・生活記録アプリ",
  description: "睡眠、服薬、気分、日常行動を記録する単一利用者向けアプリ"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
