"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppUser } from "@/contexts/user-context";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Job } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Loader2,
  MapPin,
  PlusCircle,
  Search,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Schemas
// Schemas
const jobSelectionBaseSchema = z.object({
  jobId: z.string().optional(),
  isNewJob: z.boolean().default(false),
  // New Job Fields
  title: z.string().optional(),
  companyName: z.string().optional(),
  externalUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  employmentType: z
    .enum([
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "TEMPORARY",
      "INTERN",
      "FREELANCE",
    ])
    .optional(),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]).optional(),
});

const applicationDetailsSchema = z.object({
  status: z
    .enum([
      "SAVED",
      "APPLIED",
      "INTERVIEW",
      "INTERVIEWING",
      "OFFER",
      "REJECTED",
      "HIRED",
      "ARCHIVED",
    ])
    .default("APPLIED"),
  appliedAt: z.date().optional(),
  notes: z.string().optional(),
});

const interviewBaseSchema = z.object({
  scheduleInterview: z.boolean().default(false),
  mode: z.enum(["VIRTUAL", "ONSITE", "HYBRID"]).default("VIRTUAL"),
  interviewStatus: z
    .enum(["PLANNING", "SCHEDULED", "COMPLETED", "CANCELLED"])
    .default("PLANNING"),
  scheduledFor: z.date().optional(),
  durationMinutes: z.coerce.number().min(15).default(45),
  meetLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

const combinedSchema = jobSelectionBaseSchema
  .extend(applicationDetailsSchema.shape)
  .extend(interviewBaseSchema.shape)
  .superRefine((data, ctx) => {
    // Job Selection Validation
    if (data.isNewJob) {
      if (!data.title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Title required",
          path: ["title"],
        });
      }
      if (!data.companyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company required",
          path: ["companyName"],
        });
      }
    } else {
      if (!data.jobId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "You must select a job",
          path: ["jobId"],
        });
      }
    }

    // Interview Validation
    if (
      data.scheduleInterview &&
      data.interviewStatus === "SCHEDULED" &&
      !data.scheduledFor
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date required for scheduled interviews",
        path: ["scheduledFor"],
      });
    }
  });

type FormValues = z.infer<typeof combinedSchema>;

interface NewApplicationDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, title: "Job", icon: Briefcase },
  { id: 2, title: "Details", icon: CheckCircle2 },
  { id: 3, title: "Interview", icon: Video },
];

export default function NewApplicationDialog({
  children,
  onSuccess,
}: NewApplicationDialogProps) {
  const { currentProfile } = useAppUser();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [, setIsSearchingJobs] = useState(false);

  const form = useForm({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      isNewJob: false,
      status: "APPLIED",
      appliedAt: new Date(),
      scheduleInterview: false,
      mode: "VIRTUAL",
      interviewStatus: "PLANNING",
      durationMinutes: 45,
    } as any,
  });

  // Watchers
  const isNewJob = form.watch("isNewJob");
  const scheduleInterview = form.watch("scheduleInterview");

  useEffect(() => {
    if (open) {
      loadJobs();
    }
  }, [open]);

  const loadJobs = async () => {
    setIsSearchingJobs(true);
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
      toast.error("Error loading jobs");
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger([
        "jobId",
        "title",
        "companyName",
        "externalUrl",
        "location",
        "employmentType",
        "workMode",
      ]);
    } else if (step === 2) {
      isValid = await form.trigger(["status", "appliedAt", "notes"]);
    }

    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  async function onSubmit(values: FormValues) {
    if (!currentProfile?.id) return;

    setIsLoading(true);
    try {
      let jobId = values.jobId;

      // 1. Create Job if needed
      if (values.isNewJob) {
        const newJob = await api.createJob({
          title: values.title!,
          companyName: values.companyName!,
          externalUrl: values.externalUrl || undefined,
          location: values.location || undefined,
          employmentType: values.employmentType || "FULL_TIME",
          workMode: values.workMode || "ONSITE",
          source: "MANUAL",
        });
        jobId = newJob.id;
      }

      if (!jobId) throw new Error("No job ID determined");

      // 2. Create Application
      const application = await api.upsertApplication(
        currentProfile.id,
        jobId,
        {
          status: values.status,
          appliedAt: values.appliedAt,
          notes: values.notes,
        }
      );

      // 3. Create Interview if requested
      if (values.scheduleInterview) {
        await api.createInterviewSession(currentProfile.id, application.id, {
          mode: values.mode,
          status: values.interviewStatus,
          scheduledFor: values.scheduledFor,
          durationMinutes: values.durationMinutes,
          meetLink: values.meetLink || undefined,
          notes: values.notes
            ? `Application notes: ${values.notes}`
            : undefined,
        });
      }

      toast.success("Application registered successfully");
      form.reset();
      setStep(1);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Error registering application");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="default"
            className="gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            New Application
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-150 p-0 overflow-hidden gap-0">
        {/* Header with Progress */}
        <div className="bg-muted/30 border-b border-border/50 px-6 py-4">
          <DialogHeader className="mb-4">
            <DialogTitle>Register Application</DialogTitle>
            <DialogDescription>
              Manage your selection processes
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between relative px-2">
            {/* Progress Bar Background */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10" />

            {/* Active Progress Bar */}
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-300 -z-10"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = s.id < step;

              return (
                <div
                  key={s.id}
                  className="flex flex-col items-center gap-2 p-2"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-background",
                      isActive
                        ? "bg-primary text-primary-foreground scale-110"
                        : isCompleted
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="max-h-[60vh]">
              <div className="p-6">
                {/* STEP 1: JOB SELECTION */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="isNewJob"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Create new job manually</FormLabel>
                            <DialogDescription>
                              If you don't find the job in the list, you can
                              create it here.
                            </DialogDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {!isNewJob ? (
                      <FormField
                        control={form.control}
                        name="jobId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Search Existing Job</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between pl-3 font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? jobs.find(
                                          (job) => job.id === field.value
                                        )?.title +
                                        " @ " +
                                        jobs.find(
                                          (job) => job.id === field.value
                                        )?.companyName
                                      : "Select job..."}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-137.5 p-0"
                                align="start"
                              >
                                <Command>
                                  <CommandInput placeholder="Search by title or company..." />
                                  <CommandList>
                                    <CommandEmpty>No jobs found.</CommandEmpty>
                                    <CommandGroup>
                                      {jobs.map((job) => (
                                        <CommandItem
                                          value={
                                            job.title + " @ " + job.companyName
                                          }
                                          key={job.id}
                                          onSelect={() => {
                                            form.setValue("jobId", job.id);
                                          }}
                                        >
                                          <CheckCircle2
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              job.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">
                                              {job.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {job.companyName}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Role / Title{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Ex: Frontend Developer"
                                      className="pl-9"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Company{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Ex: Acme Corp"
                                      className="pl-9"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="externalUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Offer URL</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="https://..."
                                    className="pl-9"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="workMode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Mode</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="REMOTE">
                                      Remote
                                    </SelectItem>
                                    <SelectItem value="HYBRID">
                                      Hybrid
                                    </SelectItem>
                                    <SelectItem value="ONSITE">
                                      Onsite
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="employmentType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contract Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="FULL_TIME">
                                      Full Time
                                    </SelectItem>
                                    <SelectItem value="PART_TIME">
                                      Part Time
                                    </SelectItem>
                                    <SelectItem value="CONTRACT">
                                      Contract
                                    </SelectItem>
                                    <SelectItem value="FREELANCE">
                                      Freelance
                                    </SelectItem>
                                    <SelectItem value="INTERN">
                                      Internship
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Ex: Santiago, Chile"
                                    className="pl-9"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: APPLICATION DETAILS */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SAVED">Saved</SelectItem>
                                <SelectItem value="APPLIED">Sent</SelectItem>
                                <SelectItem value="INTERVIEW">
                                  Interview (General)
                                </SelectItem>
                                <SelectItem value="INTERVIEWING">
                                  Interviewing
                                </SelectItem>
                                <SelectItem value="OFFER">Offer</SelectItem>
                                <SelectItem value="REJECTED">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="appliedAt"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Sent Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", {
                                        locale: enUS,
                                      })
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <div className="p-2 border-b border-border/50 text-xs text-muted-foreground text-center">
                                  Application Calendar
                                </div>
                                {/* Note: In a real app we'd integrate a Calendar component here, sticking to standard input for now or assume a date picker exists.
                                        Since standard input type="date" is easiest for now without Calendar component import setup: */}
                                <Input
                                  type="date"
                                  className="border-0 focus-visible:ring-0"
                                  onChange={(e) =>
                                    field.onChange(new Date(e.target.value))
                                  }
                                  value={
                                    field.value
                                      ? format(field.value, "yyyy-MM-dd")
                                      : ""
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notes about the application, expected salary, etc."
                              className="resize-none h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* STEP 3: INTERVIEW */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="scheduleInterview"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Schedule Interview</FormLabel>
                            <DialogDescription>
                              Do you want to schedule an initial interview now?
                            </DialogDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {scheduleInterview && (
                      <div className="space-y-4 pt-2 pl-2 border-l-2 border-primary/20 ml-5">
                        <FormField
                          control={form.control}
                          name="mode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mode</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="VIRTUAL">
                                    Virtual (Meet/Zoom)
                                  </SelectItem>
                                  <SelectItem value="ONSITE">Onsite</SelectItem>
                                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormItem className="flex flex-col">
                            <FormLabel>Date and Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                onChange={(e) =>
                                  form.setValue(
                                    "scheduledFor",
                                    new Date(e.target.value)
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>

                          <FormField
                            control={form.control}
                            name="durationMinutes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration (min)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="meetLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meeting Link (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://meet.google.com/..."
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/20 flex justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button type="button" onClick={nextStep} disabled={isLoading}>
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Finish
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
