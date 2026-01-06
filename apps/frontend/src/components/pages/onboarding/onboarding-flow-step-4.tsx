"use client";

import { GraduationCap, Plus, Trash2 } from "lucide-react";
import type { FieldArrayWithId, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateForInput } from "@/lib/utils";
import type { CreateProfileInput } from "@/schemas/user";

export interface OnboardingFlowStep4Props {
  form: UseFormReturn<CreateProfileInput>;
  appendEdu: (edu: CreateProfileInput["educations"][number]) => void;
  removeEdu: (index: number) => void;
  eduFields: FieldArrayWithId<CreateProfileInput, "educations", "id">[];
}

export default function OnboardingFlowStep4({
  form,
  appendEdu,
  removeEdu,
  eduFields,
}: OnboardingFlowStep4Props) {
  const educations = form.watch("educations") || [];

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
              startDate: new Date(),
              endDate: new Date(),
              current: false,
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
                          field.value as Date | undefined,
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
                        disabled={educations?.[index]?.current === true}
                        value={formatDateForInput(
                          field.value as Date | undefined,
                        )}
                        onChange={(e) => field.onChange(e.target.valueAsDate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`educations.${index}.current`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked === true) {
                          form.setValue(`educations.${index}.endDate`, null, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I currently study here</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`educations.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
