import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactSection() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative isolate flex items-center justify-center bg-background">
          {/* Background Pattern */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 -z-10 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-border/30 opacity-60"
          >
            <defs>
              <pattern
                x="50%"
                y={-64}
                id="contact-pattern"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M100 200V.5M.5 .5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-64} className="overflow-visible fill-muted/20">
              <path
                d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M299.5 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect
              fill="url(#contact-pattern)"
              width="100%"
              height="100%"
              strokeWidth={0}
            />
          </svg>

          {/* Main Content Container */}
          <div className="mx-auto w-full">
            <div className="flex flex-col lg:flex-row gap-16 sm:gap-y-20">
              {/* Left Side: Form */}
              <div className="lg:flex-auto lg:w-1/2">
                <h2 className="text-4xl font-semibold tracking-tight text-pretty text-foreground sm:text-5xl">
                  Get in touch
                </h2>
                <p className="mt-4 text-lg/8 text-muted-foreground">
                  Need a custom High-Volume Plan? Want to integrate our Credit
                  System into your agency? Let's talk enterprise.
                </p>

                <form action="#" method="POST" className="mt-10">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="first-name">First name</Label>
                      <div className="mt-2.5">
                        <Input
                          id="first-name"
                          name="first-name"
                          type="text"
                          autoComplete="given-name"
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="last-name">Last name</Label>
                      <div className="mt-2.5">
                        <Input
                          id="last-name"
                          name="last-name"
                          type="text"
                          autoComplete="family-name"
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="mt-2.5">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <div className="mt-2.5">
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="message">Message</Label>
                      <div className="mt-2.5">
                        <Textarea
                          id="message"
                          name="message"
                          rows={4}
                          className="bg-background/50"
                          defaultValue={""}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-10">
                    <Button type="submit" size="lg" className="w-full">
                      Send message
                    </Button>
                  </div>
                  <p className="mt-4 text-sm/6 text-muted-foreground">
                    By submitting this form, I agree to the{" "}
                    <a
                      href="#"
                      className="font-semibold text-primary hover:text-primary/80"
                    >
                      privacy policy
                    </a>
                    .
                  </p>
                </form>
              </div>

              {/* Right Side: Testimonial */}
              <div className="lg:w-1/2 lg:flex lg:flex-col lg:justify-center">
                <div className="rounded-2xl bg-muted/30 p-8 border border-border/50 backdrop-blur-sm lg:p-12">
                  <figure className="mt-4">
                    <blockquote className="text-lg/8 font-medium text-foreground">
                      <p>
                        “I used to spend 20 hours a week customizing resumes.
                        With Chambear, I applied to 50 tailored roles while I
                        was sleeping. I woke up to 3 interview requests.”
                      </p>
                    </blockquote>
                    <figcaption className="mt-10 flex gap-x-6 items-center">
                      <img
                        alt="Alex Rivera"
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                        className="size-12 flex-none rounded-full bg-muted object-cover"
                      />
                      <div>
                        <div className="text-base font-semibold text-foreground">
                          Alex Rivera
                        </div>
                        <div className="text-sm/6 text-muted-foreground">
                          Senior Frontend Engineer
                        </div>
                      </div>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
