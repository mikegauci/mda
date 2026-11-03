import type { Metadata } from "next";
import localFont from "next/font/local";
import { env } from "@/lib/env";
import "./globals.css";
import { CartProvider } from "@/components/shop/cart";

// MADE Outer Sans, self-hosted by the live theme with the same weights:
// Thin is 300 (body), Regular 500, Black 700 (headings).
const made = localFont({
  src: [
    { path: "./fonts/MADE-Outer-Sans-Thin.otf", weight: "300" },
    { path: "./fonts/MADE-Outer-Sans-Regular.otf", weight: "500" },
    { path: "./fonts/MADE-Outer-Sans-Black.otf", weight: "700" },
  ],
  variable: "--font-made",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Malta Detailing Academy",
    template: "%s - Malta Detailing Academy",
  },
  description:
    "Detailing courses in Malta: learn to detail your own car with one-to-one practice with professional instructors.",
  openGraph: {
    siteName: "Malta Detailing Academy",
    locale: "en_US",
    type: "website",
    images: ["/brand/og-default.jpg"],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${made.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
