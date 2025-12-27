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
import { CreateProfileInput } from "@/schemas/user";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { FieldArrayWithId, UseFormReturn } from "react-hook-form";

export interface OnboardingFlowStep3Props {
  form: UseFormReturn<CreateProfileInput>;
  appendExp: (exp: CreateProfileInput["experiences"][number]) => void;
  removeExp: (index: number) => void;
  expFields: FieldArrayWithId<CreateProfileInput, "experiences", "id">[];
}

export default function OnboardingFlowStep3({
  form,
  appendExp,
  removeExp,
  expFields,
}: OnboardingFlowStep3Props) {
  const experiences = form.watch("experiences");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Work Experience</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendExp({
              title: "",
              company: "",
              startDate: new Date(),
              current: false,
              summary: "",
              highlights: [],
              location: "",
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      {expFields.map((field, index) => (
        <Card
          key={field.id}
          className="relative group overflow-y-scroll h-full max-h-full"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => removeExp(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <CardHeader className="bg-muted/40 py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" /> Position #
              {index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`experiences.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`experiences.${index}.company`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
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
                name={`experiences.${index}.startDate`}
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
                name={`experiences.${index}.endDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={experiences?.[index]?.current}
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

            <FormField
              control={form.control}
              name={`experiences.${index}.current`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue(`experiences.${index}.endDate`, null, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I currently work here</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`experiences.${index}.summary`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
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
      {expFields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          No experience recorded.
        </div>
      )}
    </div>
  );
}
