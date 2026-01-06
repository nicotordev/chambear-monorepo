"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatDateForInput } from "@/lib/utils";
import { CreateProfileInput } from "@/schemas/user";
import { Award, Plus, Trash2 } from "lucide-react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";

export interface OnboardingFlowStep5Props {
  form: UseFormReturn<CreateProfileInput>;
  appendCert: (cert: CreateProfileInput["certifications"][number]) => void;
  removeCert: (index: number) => void;
  certFields: FieldArrayWithId<CreateProfileInput, "certifications", "id">[];
}

export default function OnboardingFlowStep5({
  form,
  appendCert,
  removeCert,
  certFields,
}: OnboardingFlowStep5Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Certifications</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendCert({
              name: "",
              issuingOrganization: "",
              issueDate: new Date(),
              expirationDate: null,
              credentialId: "",
              credentialUrl: "",
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      {certFields.map((field, index) => (
        <Card key={field.id} className="relative group overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeCert(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <CardHeader className="bg-muted/40 py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />{" "}
              Certification #{index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`certifications.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`certifications.${index}.issuingOrganization`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`certifications.${index}.issueDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={formatDateForInput(
                          field.value as Date | undefined
                        )}
                        onChange={(e) => field.onChange(e.target.valueAsDate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`certifications.${index}.expirationDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={formatDateForInput(
                          field.value as Date | undefined
                        )}
                        onChange={(e) => field.onChange(e.target.valueAsDate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`certifications.${index}.credentialId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`certifications.${index}.credentialUrl`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      {certFields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          No certifications recorded.
        </div>
      )}
    </div>
  );
}
