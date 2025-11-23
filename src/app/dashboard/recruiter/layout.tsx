import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, PlusCircle } from "lucide-react";

import { Notifications } from "@/components/Notifications";

export default function RecruiterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:block">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary">ResumeAI <span className="text-xs text-muted-foreground">Recruiter</span></h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/jobs">
                            <Briefcase className="mr-2 h-4 w-4" />
                            My Jobs
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/jobs/create">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Post a Job
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link href="/dashboard/recruiter/candidates">
                            <Users className="mr-2 h-4 w-4" />
                            Candidates
                        </Link>
                    </Button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b h-16 flex items-center justify-between px-6">
                    <div className="md:hidden">Menu</div>
                    <div className="ml-auto flex items-center gap-4">
                        <Notifications />
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>
                <main className="p-6 flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
