import DashboardBilling from "@/components/dashboard/billing/dashboard-billing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | CareerCare.ai",
  description: "Manage your billing and subscriptions",
};

export default function BillingPage() {
  return <DashboardBilling />;
}
