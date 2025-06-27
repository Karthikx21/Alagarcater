"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-card shadow-card border-b-2 border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary hover:text-primary-dark transition-colors">
                Algar Catering
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
              >
                Home
              </Link>
              <Link
                href="/menu"
                className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
              >
                Menu
              </Link>
              {session && (
                <>
                  <Link
                    href="/dashboard"
                    className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin"
                    className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
                  >
                    Admin
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-foreground font-semibold bg-accent px-3 py-1 rounded-md">{session.user?.username}</span>
                <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link href="/login">
                  <Button variant="outline">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 