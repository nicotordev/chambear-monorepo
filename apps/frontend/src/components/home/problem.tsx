import { FileText, Search, XCircle } from "lucide-react";
import { Badge } from "../ui/badge";

const problems = [
  {
    name: "Limited Visibility",
    description:
      "You miss 70% of opportunities because they live on individual company sites, not just on LinkedIn or Indeed.",
    icon: Search,
  },
  {
    name: "Keyword Guessing",
    description:
      'If you search for "Software Engineer" you miss "Product Developer". You shouldn\'t need to guess how companies name their roles.',
    icon: FileText,
  },
  {
    name: "Information Overload",
    description:
      "Wasting hours reading descriptions that don't match your seniority or tech stack just to find one potential lead.",
    icon: XCircle,
  },
];

export default function Problem() {
  return (
    <section className="overflow-hidden bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
          <div className="px-6 lg:px-0 lg:pt-4 lg:pr-4">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
              <Badge
                variant="outline"
                className="mb-4 border-primary/20 text-primary bg-primary/5"
              >
                The Old Way
              </Badge>
              <h2 className="text-base/7 font-semibold text-primary">
                The Application Trap
              </h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                You can't check every website
              </p>
              <p className="mt-6 text-lg/8 text-muted-foreground">
                The best jobs aren't always on the big boards. They're hidden on
                company career pages, waiting to be found. But you don't have
                time to scrape the entire internet.
              </p>
              <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-muted-foreground lg:max-w-none">
                {problems.map((problem) => (
                  <div key={problem.name} className="relative pl-9">
                    <dt className="inline font-semibold text-foreground">
                      <problem.icon
                        aria-hidden="true"
                        className="absolute top-1 left-1 size-5 text-primary"
                      />
                      {problem.name}
                    </dt>{" "}
                    <dd className="inline">{problem.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="sm:px-6 lg:px-0">
            <div className="relative isolate overflow-hidden bg-primary/5 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pt-16 sm:pr-0 sm:pl-16 lg:mx-0 lg:max-w-none border border-border">
              <div
                aria-hidden="true"
                className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-background/50 opacity-20 ring-1 ring-border ring-inset"
              />
              <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                {/* Abstract representation of "chaos" or "manual work" using CSS shapes since we don't have the specific image */}
                <div className="w-160 max-w-none rounded-tl-xl bg-card ring-1 ring-border shadow-2xl p-6 space-y-4">
                  <div className="flex items-center gap-4 border-b border-border pb-4">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-20 w-full bg-muted/20 rounded border border-border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                      CV_Final_v3_Real_Final.pdf
                    </div>
                    <div className="h-20 w-full bg-muted/20 rounded border border-border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                      Cover_Letter_Company_X.docx
                    </div>
                    <div className="h-20 w-full bg-muted/20 rounded border border-border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                      Application_Form_Data.xlsx
                    </div>
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
