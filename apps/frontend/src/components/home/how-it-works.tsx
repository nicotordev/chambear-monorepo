import { Briefcase, Search, Upload } from "lucide-react";
import { Badge } from "../ui/badge";

const steps = [
  {
    icon: Upload,
    title: "1. Profile Analysis",
    description:
      "Upload your CV. We use AI to understand your skils and generate optimal search terms.",
  },
  {
    icon: Search,
    title: "2. Global Scraping",
    description:
      "Our agents scour the web, visiting company career pages and scraping real-time job data.",
  },
  {
    icon: Briefcase,
    title: "3. AI Matching",
    description:
      "We extract core requirements and re-process every job to calculate a precise compatibility score.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-125 h-125 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-5%] w-125 h-125 bg-accent/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <Badge
            variant="outline"
            className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5"
          >
            How it works
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter max-w-2xl bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your path to the perfect job
          </h2>
          <p className="text-muted-foreground text-lg max-w-150 md:text-xl">
            We've simplified the job search process into three easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-11 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-transparent via-border to-transparent z-0" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center relative z-10 group"
            >
              <div className="mb-6 relative">
                <div className="w-20 h-20 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-[0_0_30px_-5px_var(--color-primary)] transition-all duration-300 ease-out">
                  <step.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border-2 border-background shadow-md">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-200">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
