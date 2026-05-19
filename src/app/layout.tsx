import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工厂生产管理系统",
  description: "外壳加工厂生产管理 MES 系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
