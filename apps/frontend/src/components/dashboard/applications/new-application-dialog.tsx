"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase,
  Building2,
  Link as LinkIcon,
  Loader2,
  PlusCircle,
  Send,
} from "lucide-react";
import { useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Schema de validación
const formSchema = z.object({
  jobTitle: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  companyName: z.string().min(2, "El nombre de la empresa es requerido"),
  status: z
    .enum(["APPLIED", "INTERVIEW", "OFFER", "REJECTED"])
    .default("APPLIED"),
  url: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewApplicationDialogProps {
  children?: React.ReactNode; // Para personalizar el botón que abre el modal
  onSuccess?: () => void; // Callback para recargar datos
}

export default function NewApplicationDialog({
  children,
  onSuccess,
}: NewApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      jobTitle: "",
      companyName: "",
      status: "APPLIED",
      url: "",
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      // AQUÍ: Llamada a tu API real
      // await api.applications.create(values);

      // Simulación de delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Datos enviados:", values);
      toast.success("Postulación creada exitosamente");

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Error al crear la postulación");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild={false}>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="default"
            className="gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Nueva Postulación
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-137.5 p-0">
        <div className="px-6 pt-6 pb-0">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Registrar Postulación
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Agrega manualmente una postulación externa para darle
                  seguimiento.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="px-6 space-y-4">
              <div className="grid grid-cols-2 gap-5">
                {/* Título del Puesto */}
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Puesto
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <Input
                            placeholder="Ej: Frontend Developer"
                            className="pl-9 h-10 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Empresa */}
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Empresa
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <Input
                            placeholder="Ej: Google"
                            className="pl-9 h-10 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Estado */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Estado Actual
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-muted/30 border-muted-foreground/20">
                            <SelectValue placeholder="Selecciona estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="APPLIED">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              <span>Enviada</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="INTERVIEW">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                              <span>Entrevista</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="OFFER">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                              <span>Oferta</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="REJECTED">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                              <span>Rechazada</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* URL (Opcional) */}
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Link (Opcional)
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <Input
                            placeholder="https://linkedin.com/..."
                            className="pl-9 h-10 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Notas Personales
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="Detalles sobre el stack tecnológico, rango salarial, o puntos clave de la vacante..."
                          className="resize-none min-h-25 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all pl-3"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border/50 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Registrar Postulación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
