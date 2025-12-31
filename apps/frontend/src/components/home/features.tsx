import { BarChart, Bell, Coins, Filter, Globe, Shield } from "lucide-react";

const features = [
  {
    name: "Global Reach",
    description:
      "Search and apply to jobs in 50+ countries. We handle the currency conversions and timezone differences for you.",
    icon: Globe,
  },
  {
    name: "Real-time Alerts",
    description:
      "Get instant notifications for 90%+ matches. Be the first applicant in the pile, every single time.",
    icon: Bell,
  },
  {
    name: "Privacy First",
    description:
      "Your data is encrypted and never sold. You control exactly which companies can see your anonymized profile.",
    icon: Shield,
  },
  {
    name: "Application Tracking",
    description:
      "Watch your application status in real-time. From 'Sent' to 'Interview', track every step of your journey.",
    icon: BarChart,
  },
  {
    name: "Salary Insights",
    description:
      "Know your worth with real-time market data for every role. Negotiate with confidence using verified benchmarks.",
    icon: Coins,
  },
  {
    name: "Smart Filters",
    description:
      "Exclude companies or industries you don't want to work for. Focus only on the opportunities that matter.",
    icon: Filter,
  },
];

export default function Features() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-base/7 font-semibold text-primary">
            Everything you need
          </h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-foreground sm:text-5xl">
            No limits, just results
          </p>
          <p className="mt-6 text-lg/8 text-muted-foreground">
            We provide the most comprehensive toolkit for the modern job seeker.
            Automate the boring stuff and focus on the interview.
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
