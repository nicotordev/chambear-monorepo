"use client";

import { useOnboarding } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  Briefcase,
  GraduationCap,
  User,
  Cpu,
} from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { SkillLevel } from "@/schemas/user";
import { cn } from "@/lib/utils";

export default function OnboardingFlow() {
  const { form, currentStep, handleStep, totalSteps, onSubmit, isPending } =
    useOnboarding();

  const progress = (currentStep / totalSteps) * 100;

  const nextStep = async () => {
    const fieldsToValidate: any[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate.push("headline", "summary", "location", "yearsExperience");
    } else if (currentStep === 2) {
      fieldsToValidate.push("targetRoles", "skills");
    } else if (currentStep === 3) {
      fieldsToValidate.push("experiences");
    } else if (currentStep === 4) {
      fieldsToValidate.push("educations");
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep < totalSteps) {
        handleStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        onSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      handleStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 flex justify-center items-start">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header / Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <Progress value={progress} className="h-2 w-full" />
        </div>

        {/* Main Form Card */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentStep === 1 && <User className="h-6 w-6 text-primary" />}
              {currentStep === 2 && <Cpu className="h-6 w-6 text-primary" />}
              {currentStep === 3 && (
                <Briefcase className="h-6 w-6 text-primary" />
              )}
              {currentStep === 4 && (
                <GraduationCap className="h-6 w-6 text-primary" />
              )}
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Roles & Skills"}
              {currentStep === 3 && "Work Experience"}
              {currentStep === 4 && "Education"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                "Tell us a bit about yourself to get started."}
              {currentStep === 2 &&
                "What kind of roles are you looking for and what are your skills?"}
              {currentStep === 3 && "Add your professional background."}
              {currentStep === 4 && "Add your educational background."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                {currentStep === 1 && <StepOne form={form} />}
                {currentStep === 2 && <StepTwo form={form} />}
                {currentStep === 3 && <StepThree form={form} />}
                {currentStep === 4 && <StepFour form={form} />}
              </form>
            </Form>
          </CardContent>

          <Separator />

          <CardFooter className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isPending}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={nextStep} disabled={isPending} className="min-w-[120px]">
              {currentStep === totalSteps ? (
                isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Complete
                  </>
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// --- Step Components ---

function StepOne({ form }: { form: any }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <FormField
        control={form.control}
        name="headline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Professional Headline</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Senior Full Stack Developer" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Santiago, Chile" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="yearsExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Experience</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Professional Summary</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Briefly describe your professional background and goals..."
                className="h-32 resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepTwo({ form }: { form: any }) {
  // Target Roles Helper
  const {
    fields: roleFields,
    append: appendRole,
    remove: removeRole,
  } = useFieldArray({
    control: form.control,
    name: "targetRoles",
  });

  // Skills Helper
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Target Roles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Target Roles</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendRole("New Role")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Role
          </Button>
        </div>
        {roleFields.length === 0 && (
          <div className="text-sm text-muted-foreground italic border border-dashed rounded-md p-4 text-center">
            No roles added yet.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roleFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`targetRoles.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="e.g. Frontend Engineer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => removeRole(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Skills</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendSkill({ skillName: "", level: SkillLevel.INTERMEDIATE })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Skill
          </Button>
        </div>
         {skillFields.length === 0 && (
          <div className="text-sm text-muted-foreground italic border border-dashed rounded-md p-4 text-center">
            No skills added yet.
          </div>
        )}
        <div className="space-y-3">
          {skillFields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col md:flex-row gap-3 items-end md:items-start border p-3 rounded-md bg-background"
            >
              <FormField
                control={form.control}
                name={`skills.${index}.skillName`}
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel className="text-xs">Skill Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. React" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`skills.${index}.level`}
                render={({ field }) => (
                  <FormItem className="w-full md:w-[180px]">
                     <FormLabel className="text-xs">Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SkillLevel).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 mb-0.5"
                onClick={() => removeSkill(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepThree({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "experiences",
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              title: "",
              company: "",
              startDate: new Date(),
              current: false,
              highlights: [],
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Experience
        </Button>
      </div>

       {fields.length === 0 && (
          <div className="text-sm text-muted-foreground italic border border-dashed rounded-md p-8 text-center flex flex-col items-center gap-2">
            <Briefcase className="h-8 w-8 text-muted-foreground/50" />
            <p>No work experience added yet.</p>
          </div>
        )}

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2">
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
               </div>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Software Engineer" />
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
                          <Input {...field} placeholder="e.g. Acme Corp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`experiences.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              field.value instanceof Date
                                ? field.value.toISOString().split("T")[0]
                                : field.value
                            }
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
                             {...field}
                             value={
                              field.value instanceof Date
                                ? field.value.toISOString().split("T")[0]
                                : field.value || ""
                            }
                            disabled={form.watch(`experiences.${index}.current`)}
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
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I currently work here
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name={`experiences.${index}.summary`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What did you achieve in this role?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function StepFour({ form }: { form: any }) {
    const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "educations",
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              school: "",
              degree: "",
              field: "",
              startDate: new Date(),
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Education
        </Button>
      </div>

       {fields.length === 0 && (
          <div className="text-sm text-muted-foreground italic border border-dashed rounded-md p-8 text-center flex flex-col items-center gap-2">
            <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
            <p>No education added yet.</p>
          </div>
        )}

      <div className="space-y-4">
          {fields.map((field, index) => (
             <Card key={field.id} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
               </div>
               <CardContent className="pt-6 space-y-4">
                 <FormField
                    control={form.control}
                    name={`educations.${index}.school`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School / University</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Stanford University" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                    control={form.control}
                    name={`educations.${index}.degree`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Bachelor's" />
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
                          <Input {...field} placeholder="e.g. Computer Science" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`educations.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                             value={
                              field.value instanceof Date
                                ? field.value.toISOString().split("T")[0]
                                : field.value
                            }
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
                        <FormLabel>End Date (or Expected)</FormLabel>
                        <FormControl>
                           <Input
                            type="date"
                             {...field}
                              value={
                              field.value instanceof Date
                                ? field.value.toISOString().split("T")[0]
                                : field.value || ""
                            }
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
      </div>
    </div>
  );
}
