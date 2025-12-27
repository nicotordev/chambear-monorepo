import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";
import Image from "next/image";
import TabTrigger from "@/components/tab-triggers";

export default function Auth() {
  return (
    // CONTENEDOR PRINCIPAL
    // flex: Activa Flexbox.
    // min-h-screen: Ocupa toda la altura.
    <main className="flex min-h-screen w-full">
      {/* IZQUIERDA (Formulario)
        - w-full: En móvil ocupa el 100%.
        - md:w-1/2: En desktop ocupa exactamente el 50%.
        - bg-background: Variable de shadcn (blanco o negro según el tema).
      */}
      <section className="relative flex w-full flex-col items-center justify-center bg-background px-4 py-12 sm:px-12 md:w-1/2">
        {/* Botón Volver
           - Mobile: static (flujo normal) con margen inferior.
           - Desktop: absolute (esquina superior izquierda).
        */}
        <div className="w-full max-w-sm mb-8 md:mb-0 md:absolute md:top-8 md:left-8">
          <Link
            href="/"
            className="group flex w-fit items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            {/* Logo container usando bg-primary y text-primary-foreground */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to access your account
            </p>
          </div>

          <TabTrigger>
            <TabsContent value="sign-in">
              <SignIn
                routing="virtual"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none p-0 border-none bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    // Variables shadcn para input y botones
                    socialButtonsBlockButton:
                      "bg-background border border-input hover:bg-accent hover:text-accent-foreground text-foreground",
                    formFieldInput:
                      "bg-background border-input text-foreground focus:ring-ring",
                    formButtonPrimary:
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                    footerAction: "hidden",
                    textNormal: "text-muted-foreground",
                    textSmall: "text-muted-foreground",
                  },
                }}
              />
            </TabsContent>

            <TabsContent value="sign-up">
              <SignUp
                routing="virtual"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none p-0 border-none bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "bg-background border border-input hover:bg-accent hover:text-accent-foreground text-foreground",
                    formFieldInput:
                      "bg-background border-input text-foreground focus:ring-ring",
                    formButtonPrimary:
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                    footerAction: "hidden",
                    textNormal: "text-muted-foreground",
                    textSmall: "text-muted-foreground",
                  },
                }}
              />
            </TabsContent>
          </TabTrigger>

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* DERECHA (Visual / Branding)
        - hidden: Oculto en móvil.
        - md:flex: Visible en tablet/desktop.
        - md:w-1/2: Ocupa exactamente el 50% restante.
        - bg-muted: Color de fondo secundario de shadcn (gris suave).
        - border-l border-border: Borde izquierdo sutil usando variables del tema.
      */}
      <section className="hidden flex-col justify-between bg-muted p-10 text-foreground dark:border-l border-border md:flex md:w-1/2">
        <div className="flex items-center text-lg font-medium text-foreground">
          <Logo />
        </div>

        <div className="h-full flex items-center justify-center p-6">
          <Image
            src="/assets/img/illustrations/undraw_starting-work_ifnt.svg"
            width={720}
            height={1280}
            alt="Undraw working illustration"
            className="mx-auto max-w-full h-auto max-h-180 object-contain"
            priority
          />
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2 border-l-2 border-primary pl-6 italic">
            <p className="text-lg text-foreground">
              &ldquo;The Chambear app has been a game-changer at the moment of
              searching for jobs, it has saved me a lot of time and effort.
              Highly recommended!&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground not-italic">
              — Sofia Davis, Software Engineer
            </footer>
          </blockquote>
        </div>
      </section>
    </main>
  );
}
