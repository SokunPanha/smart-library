import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansKhmer = Noto_Sans_Khmer({
  variable: "--font-noto-khmer",
  subsets: ["khmer"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "LibraCore", template: "%s | LibraCore" },
  description: "LibraCore — ប្រព័ន្ធគ្រប់គ្រងបណ្ណាល័យ | Library Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`${inter.variable} ${notoSansKhmer.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
