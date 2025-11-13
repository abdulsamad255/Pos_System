// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "POS System",
  description: "Simple POS frontend for Go backend",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 p-4">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
