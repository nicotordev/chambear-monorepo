"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/contexts/onboarding-context";
import { CreateProfileInput } from "@/schemas/user";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";

interface CertificationEntry {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date | null;
  credentialId?: string;
  credentialUrl?: string;
}

export function CertificationStep() {
  const router = useRouter();
  const { setValue, control, getValues } = useFormContext<CreateProfileInput>();
  const { onSubmit, completeOnboarding, isPending: isSaving } = useOnboarding();

  const certifications = (useWatch({ control, name: "certifications" }) ||
    []) as CertificationEntry[];

  const addCertification = () => {
    const newCert: CertificationEntry = {
      name: "",
      issuingOrganization: "",
      issueDate: new Date(),
      expirationDate: null,
      credentialId: "",
      credentialUrl: "",
    };
    setValue("certifications", [...certifications, newCert], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updateCertification = (
    index: number,
    updates: Partial<CertificationEntry>
  ) => {
    const nextCerts = [...certifications];
    nextCerts[index] = { ...nextCerts[index], ...updates };
    setValue("certifications", nextCerts, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeCertification = (index: number) => {
    const currentCerts = getValues("certifications") || [];
    setValue(
      "certifications",
      currentCerts.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const formatDateForInput = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  return (
    <>
      <div className="space-y-10 w-full lg:w-[60%] flex flex-col">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] text-foreground tracking-tight">
            Validating <span className="text-accent italic">Expertise</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-md">
            Certifications prove your specialized skills and commitment to
            continuous learning. Stand out with your verified credentials.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <AnimatePresence mode="popLayout">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="p-6 md:p-8 border-2 border-border/50 bg-card/40 backdrop-blur-xl rounded-[32px] relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-accent/20 group-hover:bg-accent transition-colors" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    onClick={() => removeCertification(index)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>

                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Award className="h-3 w-3" /> Certification Name
                        </label>
                        <Input
                          placeholder="e.g. AWS Solutions Architect"
                          value={cert.name}
                          onChange={(e) =>
                            updateCertification(index, { name: e.target.value })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-accent rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Award className="h-3 w-3" /> Issuing Organization
                        </label>
                        <Input
                          placeholder="e.g. Amazon Web Services"
                          value={cert.issuingOrganization}
                          onChange={(e) =>
                            updateCertification(index, {
                              issuingOrganization: e.target.value,
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-accent rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Issue Date
                        </label>
                        <Input
                          type="date"
                          value={formatDateForInput(cert.issueDate)}
                          onChange={(e) =>
                            updateCertification(index, {
                              issueDate: e.target.value
                                ? new Date(e.target.value)
                                : new Date(),
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-accent rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Expiration Date
                          (Optional)
                        </label>
                        <Input
                          type="date"
                          value={formatDateForInput(cert.expirationDate)}
                          onChange={(e) =>
                            updateCertification(index, {
                              expirationDate: e.target.value
                                ? new Date(e.target.value)
                                : null,
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-accent rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          Credential ID
                        </label>
                        <Input
                          placeholder="e.g. ABC-123-XYZ"
                          value={cert.credentialId}
                          onChange={(e) =>
                            updateCertification(index, {
                              credentialId: e.target.value,
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-accent rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" /> Credential URL
                        </label>
                        <Input
                          placeholder="e.g. https://verify.com/cert"
                          value={cert.credentialUrl}
                          onChange={(e) =>
                            updateCertification(index, {
                              credentialUrl: e.target.value,
                            })
                          }
                          className="h-12 bg-background/50 border-2 border-transparent focus-visible:border-accent rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="outline"
            onClick={addCertification}
            className="w-full h-20 border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all rounded-[32px] gap-3 text-muted-foreground hover:text-accent group"
          >
            <div className="h-10 w-10 rounded-full bg-muted group-hover:bg-accent/20 flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg">Add Certification</span>
          </Button>

          {certifications.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground font-medium italic pt-4"
            >
              No certifications added yet. Show your achievements!
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/onboarding-v2?step=6")}
            className="w-full sm:w-auto h-16 px-8 text-lg rounded-full hover:bg-muted transition-all active:scale-95 text-muted-foreground order-2 sm:order-1"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button
            onClick={async () => {
              await onSubmit();
              await completeOnboarding();
              router.push("/");
            }}
            disabled={isSaving}
            className="w-full sm:w-auto h-16 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 group order-1 sm:order-2"
          >
            {isSaving ? "Saving..." : "Finish Onboarding"}
            <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>

      <div className="hidden lg:flex relative h-125 lg:h-175 w-[35%] flex items-center justify-center">
        <div className="absolute inset-0 bg-secondary/10 rounded-[40px] border border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)] opacity-[0.03]" />

          <div className="absolute inset-0 flex items-center justify-center p-8">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotateZ: [0, 0.2, 0],
              }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full max-h-125"
            >
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-[40px] -z-10" />
              <div className="relative w-full h-full rounded-[32px] overflow-hidden border-2 border-accent/20 shadow-2xl">
                <Image
                  src="/assets/img/ai/onboarding-skills.webp"
                  alt="Credentials"
                  fill
                  className="object-cover sepia-[0.2] hover:sepia-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent" />

                <div className="absolute top-8 right-8">
                  <Award className="h-12 w-12 text-accent bg-background/40 backdrop-blur-xl p-3 rounded-2xl border border-accent/20" />
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                  <div className="space-y-3">
                    <div className="h-2 w-12 bg-accent rounded-full mb-4" />
                    <div className="h-4 w-full bg-foreground/10 rounded-lg" />
                    <div className="h-3 w-2/3 bg-foreground/5 rounded-lg" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-10 left-10 pointer-events-none select-none">
            <span className="text-[10rem] font-display font-black leading-none opacity-[0.03] text-foreground block rotate-[-4deg]">
              CREDITS
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
