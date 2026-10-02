"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Application Error</h2>
          <p className="text-muted-foreground">Something went wrong. Please try again.</p>
          <Button onClick={reset}>Retry</Button>
        </div>
      </body>
    </html>
  );
}
