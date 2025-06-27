import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../index.css";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Authentication - Algar Catering",
  description: "Sign in or register for Algar Catering",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}