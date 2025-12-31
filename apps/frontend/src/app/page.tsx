import ContactSection from "@/components/home/contact-section";
import Features from "@/components/home/features";
import HeroSection from "@/components/home/hero-section";
import HowItWorks from "@/components/home/how-it-works";
import Problem from "@/components/home/problem";
import Solution from "@/components/home/solution";
import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

export default function Home() {
  return (
    <main className="mx-auto w-full">
      <Navbar />
      <HeroSection />
      <Problem />
      <Solution />
      <HowItWorks />
      <Features />
      <ContactSection />
      <Footer />
    </main>
  );
}
