"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateProfileSchemaInput } from "@/schemas/user";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { formatDateForInput } from "@/lib/utils";

export interface OnboardingFlowStep4Props {
  form: UseFormReturn<CreateProfileSchemaInput>;
  appendEdu: (edu: CreateProfileSchemaInput["educations"][number]) => void;
  removeEdu: (index: number) => void;
  eduFields: FieldArrayWithId<CreateProfileSchemaInput, "educations", "id">[];
}

export default function OnboardingFlowStep4({
  form,
  appendEdu,
  removeEdu,
  eduFields,
}: OnboardingFlowStep4Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Education</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendEdu({
              school: "",
              degree: "",
              field: "",
              startDate: undefined,
              endDate: undefined,
              description: "",
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      {eduFields.map((field, index) => (
        <Card key={field.id} className="relative group overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeEdu(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <CardHeader className="bg-muted/40 py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />{" "}
              Education #{index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <FormField
              control={form.control}
              name={`educations.${index}.school`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`educations.${index}.degree`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`educations.${index}.field`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
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
                name={`educations.${index}.startDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
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
                name={`educations.${index}.endDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (or expected)</FormLabel>
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
          </CardContent>
        </Card>
      ))}
      {eduFields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          No education recorded.
        </div>
      )}
    </div>
  );
}
