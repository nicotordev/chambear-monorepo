import type { Metadata } from "next";
import DashboardBilling from "@/components/dashboard/billing/dashboard-billing";

export const metadata: Metadata = {
  title: "Billing | CareerCare.ai",
  description: "Manage your billing and subscriptions",
};

export default function BillingPage() {
  return <DashboardBilling />;
}
