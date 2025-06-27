"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AppRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  useEffect(() => {
    // Redirect to the main app with the section parameter if provided
    if (section) {
      window.location.href = `/?section=${section}`;
    } else {
      window.location.href = "/";
    }
  }, [section]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <h2 className="text-2xl font-bold text-primary">Launching Application</h2>
      <p className="text-muted-foreground mt-2">Please wait while we redirect you...</p>
    </div>
  );
}