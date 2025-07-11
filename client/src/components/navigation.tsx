"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/language-toggle";

export default function Navigation() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <nav className="bg-card shadow-card border-b-2 border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary hover:text-primary-dark transition-colors">
                {t('common.companyName')}
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/menu"
                className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
              >
                {t('nav.menu')}
              </Link>
              {session && (
                <>
                  <Link
                    href="/dashboard"
                    className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    href="/admin"
                    className="border-transparent text-foreground hover:border-primary hover:text-primary inline-flex items-center px-3 pt-1 border-b-2 text-sm font-semibold transition-colors"
                  >
                    {t('nav.admin')}
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageToggle variant="compact" />
            
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-foreground">
                  {t('nav.loggedIn')}: {session.user?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm">
                  {t('login.signIn')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 