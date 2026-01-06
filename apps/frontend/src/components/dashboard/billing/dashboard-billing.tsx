"use client";

import {
  Check,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBilling } from "@/hooks/use-billing";
import { cn } from "@/lib/utils";

export default function DashboardBilling() {
  const {
    plans,
    subscription,
    balance,
    isLoading,
    createCheckout,
    isCreatingCheckout,
    openPortal,
    isOpeningPortal,
    topup,
    isToppingUp,
  } = useBilling();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-100" />
          <Skeleton className="h-100" />
          <Skeleton className="h-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your credits, plan, and subscription.
          </p>
        </div>

        {subscription && (
          <Button
            variant="outline"
            onClick={() => openPortal()}
            disabled={isOpeningPortal}
            className="group"
          >
            {isOpeningPortal ? "Loading..." : "Manage on Stripe"}
            <ExternalLink className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Button>
        )}
      </div>

      {/* Subscription Summary Card */}
      <Card className="overflow-hidden border-2 border-primary/10 shadow-lg bg-linear-to-br from-background to-primary/5">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="space-y-4 pb-8 md:pb-0">
              <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-xs font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Current Plan
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold">
                    {subscription?.plan?.name || "Free Plan"}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  >
                    {subscription?.status || "Active"}
                  </Badge>
                </div>
                {subscription ? (
                  <p className="text-muted-foreground">
                    Your plan renews on{" "}
                    <span className="font-medium text-foreground">
                      {new Date(
                        subscription.currentPeriodEnd,
                      ).toLocaleDateString()}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    You are on the basic plan with limited features.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-8 md:pt-0 md:pl-8">
              <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-xs font-semibold">
                <Zap className="h-4 w-4 text-yellow-500" />
                Available Credits
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-primary">
                  {balance ?? 0}
                </span>
                <span className="text-muted-foreground font-medium">
                  credits
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Credits are consumed when performing advanced AI actions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Available Plans</h2>
          <p className="text-muted-foreground">
            Choose the plan that best fits your job search speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "flex flex-col relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                subscription?.planId === plan.id &&
                  "border-primary ring-2 ring-primary ring-opacity-50",
              )}
            >
              {plan.tier === "PRO" && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-tighter px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-current" />
                    Popular
                  </div>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.tier === "FREE" && (
                    <Sparkles className="h-5 w-5 text-blue-400" />
                  )}
                  {plan.tier === "BASE" && (
                    <Zap className="h-5 w-5 text-yellow-400" />
                  )}
                  {plan.tier === "PRO" && (
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  )}
                  {plan.tier === "RESULT" && (
                    <Star className="h-5 w-5 text-purple-500" />
                  )}
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.monthlyPriceUsd / 100}
                  </span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <CardDescription className="min-h-12 mt-2">
                  {plan.description || `Ideal for ${plan.name.toLowerCase()}`}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="font-semibold text-primary">
                      {plan.monthlyCredits} Monthly credits
                    </span>
                  </div>
                  {plan.tier !== "FREE" && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Unlimited ATS Optimization</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>Priority Support</span>
                      </div>
                    </>
                  )}
                  {plan.tier === "RESULT" && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Biometric Coaching</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full font-bold transition-all"
                  variant={
                    subscription?.planId === plan.id
                      ? "secondary"
                      : plan.tier === "PRO"
                        ? "default"
                        : "outline"
                  }
                  disabled={
                    subscription?.planId === plan.id || isCreatingCheckout
                  }
                  onClick={() => createCheckout(plan.tier)}
                >
                  {subscription?.planId === plan.id
                    ? "Your Current Plan"
                    : "Upgrade Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Manual Top-up Section */}
      <Card className="bg-muted/30 border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Need more credits?
          </CardTitle>
          <CardDescription>
            Add additional credits to your account for specific actions without
            changing your plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[
              { amount: 10, price: 5 },
              { amount: 25, price: 12 },
              { amount: 50, price: 20 },
              { amount: 100, price: 35 },
            ].map(({ amount, price }) => (
              <Button
                key={amount}
                variant="outline"
                className="flex-1 min-w-40 h-20 flex flex-col gap-1 hover:border-primary hover:bg-primary/5 transition-all relative overflow-hidden group"
                disabled={isCreatingCheckout || isOpeningPortal || isToppingUp}
                onClick={() => topup(amount)}
              >
                <div className="absolute top-0 right-0 p-1">
                  <Badge variant="outline" className="text-[9px] font-bold">
                    ${price}
                  </Badge>
                </div>
                <span className="font-bold text-xl">+{amount}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Credits
                </span>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
