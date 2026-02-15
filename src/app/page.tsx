import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Briefcase, CheckCircle } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { PricingSection } from "@/components/pricing-section";
import { BkashRedirectHandler } from "@/components/bkash-redirect-handler";
import { Suspense } from "react";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={null}>
        <BkashRedirectHandler />
      </Suspense>
      {/* Header */}
      <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <FileText className="h-6 w-6" />
          <span>ResumeAI</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <SignedOut>
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/create-resume">Get Started</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button variant="ghost" asChild>
              <Link href="/onboarding">Dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-6 lg:px-12 text-center bg-gradient-to-b from-white to-gray-50">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Build Your Dream Resume with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Create professional resumes in seconds, get matched with top jobs, and let our AI agent apply for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <SignedOut>
              <Button size="lg" className="text-lg px-8 h-12" asChild>
                <Link href="/create-resume">
                  Create My Resume <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-12" asChild>
                <Link href="/sign-in">I'm a Recruiter</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button size="lg" className="text-lg px-8 h-12" asChild>
                <Link href="/onboarding">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </SignedIn>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 lg:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose ResumeAI?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-gray-50 border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Resume Builder</h3>
                <p className="text-muted-foreground">
                  Generate tailored resumes instantly with our advanced AI. Just tell us about yourself.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gray-50 border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Job Matching</h3>
                <p className="text-muted-foreground">
                  Get matched with jobs that fit your skills and experience perfectly.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gray-50 border hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Auto-Apply Agent</h3>
                <p className="text-muted-foreground">
                  Let our AI agent apply to jobs on your behalf while you sleep.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-12 border-t text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
