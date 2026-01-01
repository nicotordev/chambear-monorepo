import backend from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, PlusCircle } from "lucide-react";
import ReminderEmptyState from "@/components/dashboard/reviews/reminder-empty-state";
import ReminderCard from "@/components/dashboard/reviews/reminder-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reminders | Chambear.ai",
  description: "Manage your reminders with Chambear.ai",
};

export default async function RemindersPage() {
  const user = await backend.user.getMe();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Error loading reminders. Try reloading.
      </div>
    );
  }

  const allReminders = user.reminders ?? [];

  // Separate pending from completed
  const pendingReminders = allReminders
    .filter((r) => !r.completedAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()); // Most urgent first

  const completedReminders = allReminders
    .filter((r) => r.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    ); // Most recent first

  return (
    <div className="flex h-full flex-col space-y-8 p-8 md:flex bg-background animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reminders</h2>
          <p className="text-muted-foreground">
            Keep track of your follow-ups and important tasks.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Reminder
        </Button>
      </div>

      {/* Tabs for Pending vs History */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-100 grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingReminders.length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="pending" className="space-y-4">
            {pendingReminders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingReminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            ) : (
              <ReminderEmptyState
                message="You're up to date! You have no pending tasks."
                icon={CheckCircle2}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {completedReminders.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                {completedReminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            ) : (
              <ReminderEmptyState
                message="You haven't completed any reminders yet."
                icon={Clock}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}