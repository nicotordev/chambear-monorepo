import { BarChart, Bell, Coins, Globe, Shield, Zap } from "lucide-react";

const features = [
  {
    name: "Smart Credit System",
    description:
      "A unified wallet for all your AI needs. Spend credits on CV optimizations, cover letters, or deep analysis. You control the spend.",
    icon: Coins,
  },
  {
    name: "Tiered Subscriptions",
    description:
      "From Free to Result. Choose a plan that fits your career stage. Upgrade, downgrade, or cancel anytime.",
    icon: Bell, // You might want to import a better icon like Layers or CreditCard if available, keeping Bell for now or changing to something generic
  },
  {
    name: "Auditable AI Consumption",
    description:
      "Full transparency. See exactly how many tokens and credits each action consumes. No hidden costs.",
    icon: Shield,
  },
  {
    name: "Skill Gap Analysis",
    description:
      "Use credits to analyze your profile against target roles and identify exactly what skills you're missing.",
    icon: BarChart,
  },
  {
    name: "Interview Simulation",
    description:
      "Practice makes perfect. Simulate interviews for specific roles and get instant AI feedback.",
    icon: Zap,
  },
  {
    name: "Global Reach",
    description:
      "Search and apply to roles across 50+ countries. Currency, location, and timezone differences handled automatically.",
    icon: Globe,
  },
];

export default function Features() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="">
          <h2 className="text-base/7 font-semibold text-primary">
            Powered by Credits
          </h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-foreground sm:text-5xl">
            Surgical precision. Transparent costs.
          </p>
          <p className="mt-6 text-lg/8 text-muted-foreground">
            A complete toolkit for the modern professional. Manage your
            subscription, track your credit usage, and unlock AI superpowers on
            demand.
          </p>
        </div>

        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base/7 text-muted-foreground sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-9">
              <dt className="inline font-semibold text-foreground">
                <feature.icon
                  aria-hidden="true"
                  className="absolute top-1 left-1 size-5 text-primary"
                />
                {feature.name}
              </dt>{" "}
              <dd className="inline">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
