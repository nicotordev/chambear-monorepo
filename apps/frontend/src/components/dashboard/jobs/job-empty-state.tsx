import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function JobEmptyState() {
  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] items-center justify-center bg-background animate-in fade-in duration-500 space-y-4">
      <div className="bg-muted p-6 rounded-full">
        <SearchX className="w-12 h-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">
        No hay trabajos disponibles
      </h2>
      <p className="text-muted-foreground max-w-md text-center">
        Actualmente no hemos encontrado ofertas que coincidan o la lista está
        vacía. Intenta recargar o buscar manualmente.
      </p>
      <div className="flex gap-2">
        <Button>
          Buscar ofertas <Sparkles className="ml-2 h-4 w-4" />
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
