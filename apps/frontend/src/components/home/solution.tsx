import { CheckCircle, Target, Zap } from "lucide-react";

const features = [
  {
    name: "CV & Cover Letter Optimization",
    description:
      "Use credits to surgically adapt your CV and generate compelling cover letters for every single application.",
    icon: Zap,
  },
  {
    name: "Interview Simulation",
    description:
      "Burn a few credits to practice with our AI interviewer. It knows the role, the company, and asks the hard questions.",
    icon: Target,
  },
  {
    name: "Intelligent Re-ranking",
    description:
      "We score every opportunity against your profile. Detailed match analysis ensures you only spend effort on high-probability roles.",
    icon: CheckCircle,
  },
];

export default function Solution() {
  return (
    <section className="overflow-hidden bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-center">
          <div className="lg:pt-4 lg:pr-4 lg:order-last">
            <div className=" lg:max-w-lg">
              <h2 className="text-base/7 font-semibold text-primary">
                The Model
              </h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Pay for results, not just time
              </p>
              <p className="mt-6 text-lg/8 text-muted-foreground">
                Our credit system connects your investment directly to your
                career outcomes. Subscribe to a plan, load your wallet, and
                deploy AI agents where they have the most impact.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-muted-foreground lg:max-w-none">
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
          </div>
          <div className="sm:px-6 lg:px-0 lg:order-first">
            <div className="relative isolate overflow-hidden bg-primary/5 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pt-16 sm:pr-0 sm:pl-16 lg:mx-0 lg:max-w-none border border-border">
              <div
                aria-hidden="true"
                className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-background/50 opacity-20 ring-1 ring-border ring-inset"
              />
              <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                <div className="w-full overflow-hidden rounded-tl-xl bg-card ring-1 ring-border shadow-2xl">
                  <div className="flex bg-muted/50 ring-1 ring-border/10">
                    <div className="-mb-px flex text-sm/6 font-medium text-muted-foreground">
                      <div className="border-r border-b border-r-border/10 border-b-border/20 bg-background/5 px-4 py-2 text-foreground border-border">
                        match_result.json
                      </div>
                      <div className="border-r border-border/10 px-4 py-2">
                        app.tsx
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pt-6 pb-14 font-mono text-xs sm:text-sm text-muted-foreground">
                    <pre>
                      <code>
                        {`{
  "jobId": "j_928374",
  "matchScore": 0.98,
  "skills_matched": [
    "TypeScript",
    "React",
    "Tailwind"
  ],
  "cultural_fit": "High",
  "status": "APPROVED_FOR_AUTO_APPLY"
}`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/10 sm:rounded-3xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
