import { ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardDocuments() {
  const documents = [
    {
      name: "CV_FullStack_2025.pdf",
      size: "1.2 MB",
      type: "PDF",
      color: "text-destructive",
    },
    {
      name: "Portfolio_Design.pdf",
      size: "8.4 MB",
      type: "PDF",
      color: "text-chart-1",
    },
  ];

  return (
    <div className="p-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
        Mis Documentos
      </h3>
      <div className="grid gap-2">
        {documents.map((file, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/60 transition-all group border border-transparent hover:border-border cursor-pointer bg-secondary/20"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "p-2 bg-background rounded-lg border shadow-sm",
                  file.color,
                )}
              >
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate pr-2">{file.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {file.size}
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
