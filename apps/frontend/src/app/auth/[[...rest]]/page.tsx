import { SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* -----------------------------------------------------------------------
        LEFT SIDE (Form)
        ----------------------------------------------------------------------- */}
      <div className="relative flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:w-[45%] xl:px-24">
        {/* Mobile-only background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 lg:hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-accent/5 blur-[120px]" />
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <Button
            asChild
            variant="ghost"
            className="group gap-2 pl-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link href="/">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-sm relative z-10">
          <div className="mb-8 text-center lg:text-left">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-6 transition-transform hover:scale-105"
            >
              <Logo />
            </Link>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue your job search with intention.
            </p>
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 border-none bg-transparent w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "bg-card border border-input hover:bg-accent hover:text-accent-foreground text-foreground text-sm font-medium h-10 py-2 transition-all duration-200 hover:shadow-sm",
                socialButtonsBlockButtonText: "text-foreground font-medium",
                dividerLine: "bg-border",
                dividerText:
                  "text-muted-foreground px-2 font-medium uppercase text-xs tracking-wider",
                formFieldLabel: "text-foreground font-medium text-sm mb-1.5",
                formFieldInput:
                  "bg-background border-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-lg h-10 px-3 py-1 transition-all duration-200",
                formButtonPrimary:
                  "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:-translate-y-0.5",
                footerAction: "text-muted-foreground",
                footerActionLink:
                  "text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline transition-colors",
                formFieldAction:
                  "text-primary hover:text-primary/80 font-semibold transition-colors",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-primary hover:text-primary/90",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                socialButtonsVariant: "blockButton",
              },
            }}
          />
        </div>
      </div>

      {/* -----------------------------------------------------------------------
        RIGHT SIDE (Decorative / Atmospheric)
        ----------------------------------------------------------------------- */}
      <div className="relative hidden w-0 flex-1 lg:flex flex-col items-center justify-center bg-muted/30 dark:bg-muted/10 overflow-hidden border-l border-border/50">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 opacity-80" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-lg px-8 flex flex-col items-center">
          {/* Illustration */}
          <div className="relative w-full aspect-[4/3] mb-12 animate-in fade-in zoom-in duration-700">
            <Image
              src="/assets/img/illustrations/undraw_working_n9u0.svg"
              alt="Focused work illustration"
              fill
              className="object-contain drop-shadow-2xl mix-blend-multiply dark:mix-blend-normal"
              priority
            />
          </div>

          {/* Atmospheric Text */}
          <div className="text-center space-y-6 max-w-md animate-in slide-in-from-bottom-8 duration-700 delay-200">
            <p className="text-xl leading-relaxed tracking-tight text-foreground/85 font-normal">
              Apply with intention.
              <br />
              Every role, tailored.
              <br />
              Every decision, informed.
            </p>

            <p className="text-sm text-muted-foreground">
              Your AI-powered job search workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
