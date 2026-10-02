import { AuthProvider } from "@/components/providers/auth-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "HONOBI WOOD JOINERY | Custom Furniture & Carpentry in Ghana",
    template: "%s | HONOBI WOOD JOINERY",
  },
  description:
    "Premium custom furniture, kitchen cabinets, wardrobes, and carpentry services in Ghana. Quality craftsmanship for homes and offices.",
  keywords: ["carpentry", "furniture", "Ghana", "custom furniture", "kitchen cabinets", "wardrobes", "woodwork"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
