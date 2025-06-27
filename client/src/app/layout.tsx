import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../index.css";
import Navigation from "@/components/navigation";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Algar Catering",
  description: "Catering service management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <Navigation />
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}