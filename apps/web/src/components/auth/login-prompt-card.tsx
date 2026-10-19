import { ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LoginPromptCardProps {
  title: string;
  description: string;
  returnTo?: string;
  hostLabel?: string;
}

export function LoginPromptCard({
  title,
  description,
  returnTo = "/",
  hostLabel,
}: LoginPromptCardProps) {
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12">
      <Card className="w-full border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <ShieldCheck className="size-4 text-slate-700" />
            <span>Autenticación Federada OIDC + PKCE</span>
          </div>
          <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
          <CardDescription className="text-slate-600">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          {hostLabel ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Contexto de host actual:{" "}
              <span className="font-mono font-semibold text-slate-900">{hostLabel}</span>
            </div>
          ) : null}
          <p className="text-xs leading-relaxed text-slate-500">
            Su sesión se gestiona de forma segura en el servidor (BFF) mediante cookies{" "}
            <code className="font-mono text-slate-700">HttpOnly</code> exclusivas de este
            subdominio. Ningún token OAuth/OIDC se expone al navegador.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <a href={loginHref}>
              <KeyRound className="size-4" />
              Iniciar sesión con proveedor de identidad
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
