"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12">
      <Card className="w-full border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="size-5" />
            <CardTitle>Se produjo un error inesperado</CardTitle>
          </div>
          <CardDescription>
            No fue posible procesar la vista solicitada en este momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>{error.message || "Error interno al renderizar el componente."}</p>
          {error.digest ? (
            <p className="font-mono text-xs text-slate-500">Digest: {error.digest}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={reset} variant="default">
            <RotateCcw className="size-4" />
            Reintentar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
