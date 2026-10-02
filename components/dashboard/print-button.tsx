"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton({ autoPrint = false }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    // Small delay so the invoice finishes painting before the print dialog opens
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4 mr-2" /> Print
    </Button>
  );
}
