import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-slate-800">
            <FileQuestion className="size-5" />
            <CardTitle>Recurso no encontrado (404)</CardTitle>
          </div>
          <CardDescription>
            La página, institución o ruta solicitada no existe o no está disponible en este
            subdominio.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Verifique que la dirección web y el subdominio institucional sean correctos.
        </CardContent>
        <CardFooter>
          <ButtonLink variant="outline" href="/">
            Volver al inicio
          </ButtonLink>
        </CardFooter>
      </Card>
    </div>
  );
}
