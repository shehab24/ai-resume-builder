"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, FileText, Briefcase, CheckCircle2, Zap, 
  Sparkles, Check, Play, Globe, CheckCircle, Shield, 
  ChevronRight, Users, MessageSquare, Terminal, Download, 
  Chrome, RefreshCw, Loader2
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { PricingSection } from "@/components/pricing-section";
import { BkashRedirectHandler } from "@/components/bkash-redirect-handler";
import { Suspense } from "react";

// Extension simulation states
type SimState = "SCANNING" | "MATCHING" | "FILLING" | "SUBMITTING" | "SUCCESS";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"seeker" | "recruiter">("seeker");
  const [simState, setSimState] = useState<SimState>("SCANNING");
  const [simProgress, setSimProgress] = useState(25);

  // Rotate simulator states every 2.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setSimState((prev) => {
        switch (prev) {
          case "SCANNING":
            setSimProgress(45);
            return "MATCHING";
          case "MATCHING":
            setSimProgress(70);
            return "FILLING";
          case "FILLING":
            setSimProgress(90);
            return "SUBMITTING";
          case "SUBMITTING":
            setSimProgress(100);
            return "SUCCESS";
          case "SUCCESS":
            setSimProgress(15);
            return "SCANNING";
          default:
            return "SCANNING";
        }
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white antialiased">
      <Suspense fallback={null}>
        <BkashRedirectHandler />
      </Suspense>

      {/* Header */}
      <header className="px-6 lg:px-16 h-20 flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
            TalentFlow
          </span>
        </div>

        <nav className="hidden md:flex gap-8 text-sm font-semibold text-slate-600">
          <Link href="#features" className="hover:text-blue-700 transition-colors duration-200">Features</Link>
          <Link href="#how-it-works" className="hover:text-blue-700 transition-colors duration-200">How it Works</Link>
          <Link href="#simulator" className="hover:text-blue-700 transition-colors duration-200">Live Agent</Link>
          <Link href="#pricing" className="hover:text-blue-700 transition-colors duration-200">Pricing</Link>
        </nav>

        <div className="flex items-center gap-4">
          <SignedOut>
            <Button variant="ghost" className="font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100/50" asChild>
              <Link href="/sign-in">Log In</Link>
            </Button>
            <Button className="font-semibold bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white shadow-md shadow-blue-500/10 transition-all duration-200" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button className="font-semibold bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white" asChild>
              <Link href="/onboarding">Dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-6 lg:px-16 overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_50%)]" />
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Column (Content) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mb-6 animate-pulse">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Now Supporting Auto-Apply on LinkedIn &amp; Indeed</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6">
                Get 10x More Interviews with{" "}
                <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  AI Auto-Apply
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 font-normal leading-relaxed mb-10 max-w-2xl">
                TalentFlow automatically matches your resume with job requirements, and uses our Chrome Extension agent to apply on LinkedIn, Indeed, Glassdoor &amp; Bdjobs while you sleep.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <SignedOut>
                  <Button size="lg" className="h-14 px-8 text-base font-bold bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all" asChild>
                    <Link href="/sign-up">
                      Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold border-slate-300 text-slate-700 hover:bg-slate-50 hover:scale-[1.02] transition-all" asChild>
                    <Link href="/sign-in">
                      Recruiter Portal
                    </Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <Button size="lg" className="h-14 px-8 text-base font-bold bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20" asChild>
                    <Link href="/onboarding">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </SignedIn>
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-slate-200/80 w-full">
                <div>
                  <div className="text-3xl font-black text-blue-700">142,000+</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Jobs Applied</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-blue-700">35 Hrs</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Saved / Month</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-blue-700">4.2x</div>
                  <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Callback Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column (Simulator Mockup) */}
            <div id="simulator" className="lg:col-span-5 relative w-full flex justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-3xl blur-3xl opacity-20 transform rotate-6 scale-95" />
              
              {/* Chrome Mockup Window */}
              <div className="w-full max-w-[420px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden text-left flex flex-col font-sans">
                {/* Header bar */}
                <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700/40">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 bg-slate-950/40 rounded-md text-[10px] text-slate-400 py-1 px-3 text-center truncate mx-4 flex items-center justify-center gap-1.5">
                    <Chrome className="h-3 w-3 text-slate-500" />
                    <span>linkedin.com/jobs/view/38472910</span>
                  </div>
                </div>

                {/* Main Body */}
                <div className="p-5 flex-1 flex flex-col gap-4 min-h-[360px] bg-slate-950 text-white">
                  {/* Extension Floating Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold tracking-tight">TalentFlow Extension</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  {/* Simulated Process Content */}
                  <div className="flex-1 flex flex-col justify-center gap-5">
                    {simState === "SCANNING" && (
                      <div className="space-y-4 animate-pulse">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Target Role</span>
                          <span className="font-semibold text-blue-400">Software Engineer</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                          <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                          <div className="text-xs font-medium">Scanning job description and responsibilities...</div>
                        </div>
                      </div>
                    )}

                    {simState === "MATCHING" && (
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">AI Qualification Match</span>
                          <span className="font-semibold text-emerald-400">96% High Fit</span>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span>React, TypeScript, Node.js</span>
                            <span className="text-emerald-400">✓ Matches Resume</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Next.js, Tailwind CSS</span>
                            <span className="text-emerald-400">✓ Matches Resume</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>5+ Years Experience</span>
                            <span className="text-amber-400">! Have 4.5 Years</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {simState === "FILLING" && (
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Form Auto-Fill</span>
                          <span className="font-semibold text-indigo-400">Processing...</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px] p-2 bg-slate-900/60 rounded border border-slate-800">
                            <span className="text-slate-400">Full Name</span>
                            <span className="text-slate-200">Shehab Mahamud</span>
                          </div>
                          <div className="flex justify-between text-[11px] p-2 bg-slate-900/60 rounded border border-slate-800">
                            <span className="text-slate-400">Email Address</span>
                            <span className="text-slate-200">shehab@gmail.com</span>
                          </div>
                          <div className="flex justify-between text-[11px] p-2 bg-slate-900/60 rounded border border-slate-800">
                            <span className="text-slate-400">Resume PDF</span>
                            <span className="text-emerald-400">Uploaded ✓</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {simState === "SUBMITTING" && (
                      <div className="space-y-4 animate-pulse">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Status</span>
                          <span className="font-semibold text-amber-500">Submitting Form</span>
                        </div>
                        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                          <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                          <div className="text-xs font-medium">Bypassing captcha and submitting application...</div>
                        </div>
                      </div>
                    )}

                    {simState === "SUCCESS" && (
                      <div className="space-y-4 text-center py-2">
                        <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                          <Check className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">Applied Successfully!</div>
                          <div className="text-[10px] text-slate-500 mt-1">Google - Software Engineer</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-1.5 mt-auto">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Applying progress</span>
                      <span>{simProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 ease-out"
                        style={{ width: `${simProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Split - Seeker vs Recruiter */}
        <section id="features" className="py-24 px-6 lg:px-16 bg-white border-y border-slate-200/70">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Designed for the Modern Job Market
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto mb-12">
              Whether you are looking for your next career move or seeking to hire the best talent, TalentFlow has you covered.
            </p>

            {/* Tab Controller */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 mb-16">
              <button
                onClick={() => setActiveTab("seeker")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "seeker" 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                For Job Seekers
              </button>
              <button
                onClick={() => setActiveTab("recruiter")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === "recruiter" 
                    ? "bg-white text-blue-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Users className="h-4 w-4" />
                For Recruiters
              </button>
            </div>

            {/* Tab Contents */}
            <div className="grid md:grid-cols-3 gap-8">
              {activeTab === "seeker" ? (
                <>
                  <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-left flex flex-col">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6 text-blue-700">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">AI Resume Builder</h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      Build professional, optimized resumes in minutes using AI prompts. Tailored to beat applicant tracking systems (ATS).
                    </p>
                  </div>
                  
                  <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-left flex flex-col">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6 text-blue-700">
                      <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Extension Auto-Apply</h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      Our Chrome Extension reads form fields and answers complex application questions on LinkedIn, Indeed &amp; Glassdoor automatically.
                    </p>
                  </div>

                  <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-left flex flex-col">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6 text-blue-700">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Smart Match Scoring</h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      View percentage matching scores on your dashboard for every job listing before applying, ensuring high callback possibilities.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-left flex flex-col">
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6 text-indigo-700">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Post Jobs Instantly</h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      Create job postings on TalentFlow in seconds and define specific profile and skill match thresholds for candidates.
                    </p>
                  </div>

                  <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-left flex flex-col">
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6 text-indigo-700">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">AI Resume Screening</h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      No more manual review. Our AI scans resumes of incoming applicants and ranks candidates based on criteria fits.
                    </p>
                  </div>

                  <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 text-left flex flex-col">
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6 text-indigo-700">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Seamless Interviews</h3>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      Invite high-fit candidates directly to interview sessions with built-in scheduling, call rooms, and chat features.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* How It Works (Step-by-Step) */}
        <section id="how-it-works" className="py-24 px-6 lg:px-16 bg-slate-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Apply to 100s of Jobs in 3 Steps
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto mb-16">
              TalentFlow handles the tedious work of finding, matching, and filling forms so you can focus on preparing for the interview.
            </p>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl font-black text-blue-700 shadow-md group-hover:scale-110 transition-transform duration-200 mb-6">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Create Your Profile</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                  Fill in your details or upload your resume. Our AI builder helps optimize it to ensure high ATS compatibility.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl font-black text-blue-700 shadow-md group-hover:scale-110 transition-transform duration-200 mb-6">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Add Chrome Extension</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                  Download the TalentFlow browser extension in one click and securely link your account.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl font-black text-blue-700 shadow-md group-hover:scale-110 transition-transform duration-200 mb-6">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Auto-Apply &amp; Track</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                  Click "Auto-Apply" on matched jobs. The extension will automatically fill forms and submit them on external sites.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing">
          <PricingSection />
        </section>

        {/* Testimonials */}
        <section className="py-24 px-6 lg:px-16 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-center mb-16">
              Loved by Hundreds of Job Seekers
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
                <div className="flex text-amber-500 gap-0.5">
                  {"★".repeat(5)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  "I was skeptical at first, but TalentFlow saved me hours. The Chrome Extension automatically answers those tedious background questions. Got 3 interviews in my first week!"
                </p>
                <div>
                  <div className="text-sm font-bold text-slate-900">Ariful Islam</div>
                  <div className="text-xs text-slate-500">Software Engineer</div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
                <div className="flex text-amber-500 gap-0.5">
                  {"★".repeat(5)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  "As a recruiter, finding candidates who actually match the job description is tough. TalentFlow's AI matching score filters out 90% of irrelevant resumes instantly."
                </p>
                <div>
                  <div className="text-sm font-bold text-slate-900">Sarah Jenkins</div>
                  <div className="text-xs text-slate-500">Talent Acquisition Lead</div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-4">
                <div className="flex text-amber-500 gap-0.5">
                  {"★".repeat(5)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  "The resume builder alone is worth it, but the extension is a game changer. It applies to external jobs on LinkedIn and automatically updates my dashboard status."
                </p>
                <div>
                  <div className="text-sm font-bold text-slate-900">Tariq Rahman</div>
                  <div className="text-xs text-slate-500">Product Designer</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-16 bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                TalentFlow
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Autopilot your job search. Build beautiful resumes, match with relevant jobs, and let AI apply on your behalf.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="/talentflow-extension.zip" download className="hover:text-white transition-colors flex items-center gap-1">Download Extension <Download size={11} /></a></li>
              <li><Link href="/sign-in" className="hover:text-white transition-colors">Recruiter Portal</Link></li>
              <li><Link href="/create-resume" className="hover:text-white transition-colors">Resume AI</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white mb-4">Stay Updated</h4>
            <p className="text-xs text-slate-500">Subscribe to our newsletter for resume tips and career match updates.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email..." 
                className="flex-1 px-3 py-2 text-xs rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3">
                Join
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} TalentFlow. All rights reserved.</p>
          <div className="flex gap-4 justify-center">
            <Link href="#" className="hover:underline">Privacy Policy</Link>
            <Link href="#" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
