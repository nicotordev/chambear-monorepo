"use client";

import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";
import { InterviewMode, InterviewStatus } from "@/types/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  jobId: z.string().min(1, "Please select a job."),
  mode: z.enum([
    InterviewMode.VIRTUAL,
    InterviewMode.ONSITE,
    InterviewMode.HYBRID,
  ]),
  status: z.enum([
    InterviewStatus.PLANNING,
    InterviewStatus.SCHEDULED,
    InterviewStatus.COMPLETED,
    InterviewStatus.CANCELLED,
  ]),
  scheduledFor: z.date({
    message: "A date is required.",
  }),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  durationMinutes: z.number().min(15),
  meetLink: z.url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

interface DashboardInterviewCreationProps {
  jobs: Job[];
  profileId?: string;
  children: React.ReactNode;
}

export default function DashboardInterviewCreation({
  jobs,
  profileId,
  children,
}: DashboardInterviewCreationProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter jobs that have an application associated
  const relevantJobs = jobs.filter(
    (job) => job.applications && job.applications.length > 0
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: InterviewMode.VIRTUAL,
      status: InterviewStatus.SCHEDULED,
      durationMinutes: 45,
      time: "10:00",
      notes: "",
      meetLink: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const selectedJob = jobs.find((j) => j.id === values.jobId);
      if (!selectedJob) throw new Error("Job not found");

      const application = selectedJob.applications?.[0];
      if (!application) throw new Error("Application not found for this job");

      const scheduledDate = new Date(values.scheduledFor);
      const [hours, minutes] = values.time.split(":");
      scheduledDate.setHours(parseInt(hours), parseInt(minutes));

      const payload = {
        profileId,
        jobId: values.jobId,
        mode: values.mode,
        status: values.status,
        scheduledFor: scheduledDate,
        meetLink: values.meetLink || undefined,
        durationMinutes: values.durationMinutes,
        notes: values.notes,
      };

      if (!profileId) throw new Error("Profile ID is required");

      await api.createInterviewSession(profileId, application.id, payload);

      toast.success("Interview scheduled successfully");
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule interview");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">Schedule Interview</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Add a new interview to your calendar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Application</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relevantJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} at {job.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(InterviewMode).map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
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
                name="scheduledFor"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
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
                              format(field.value, "MMM d, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meetLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://meet.google.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any preparation notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
