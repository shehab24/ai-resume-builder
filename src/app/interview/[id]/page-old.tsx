"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    StreamTheme,
    SpeakerLayout,
    CallControls,
    CallParticipantsList,
    CallStatsButton,
    PaginatedGridLayout,
    useCallStateHooks
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Button } from "@/components/ui/button";
import { Loader2, PhoneOff, User, FileText, MessageSquare, ChevronRight, ChevronLeft, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function InterviewRoomPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<any>(null);
    const [interview, setInterview] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [questions, setQuestions] = useState<any>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        initializeCall();

        return () => {
            if (call) {
                call.leave();
            }
            if (client) {
                client.disconnectUser();
            }
        };
    }, [interviewId]);

    const initializeCall = async () => {
        try {
            // Get interview details and token
            const res = await fetch(`/api/interviews/${interviewId}/token`);
            if (!res.ok) throw new Error("Failed to get interview details");

            const data = await res.json();
            const { token, apiKey, callId, userId, userName } = data;

            // Initialize Stream client
            const videoClient = new StreamVideoClient({
                apiKey,
                user: { id: userId, name: userName },
                token,
            });

            setClient(videoClient);

            // Join the call
            const videoCall = videoClient.call('default', callId);
            await videoCall.join({ create: true });

            // Force enable camera/mic
            try {
                await videoCall.camera.enable();
                await videoCall.microphone.enable();
            } catch (e) {
                console.error("Failed to enable devices automatically:", e);
            }

            setCall(videoCall);

            // Get interview details for header
            const interviewRes = await fetch(`/api/interviews/${interviewId}`);
            if (interviewRes.ok) {
                const interviewData = await interviewRes.json();
                setInterview(interviewData);

                // Generate/Fetch questions if not present
                if (interviewData.application) {
                    fetchQuestions(interviewData.application);
                }
            }

            toast.success("Joined the interview!");
        } catch (error) {
            console.error("Error initializing call:", error);
            toast.error("Failed to join interview");
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestions = async (application: any) => {
        try {
            const res = await fetch('/api/ai/generate-interview-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateName: application.user.name || 'Candidate',
                    jobTitle: application.job.title,
                    jobRequirements: application.job.tasks,
                    resumeContent: application.resumeContent,
                    taskSubmission: application.taskSubmissions?.[0] || null,
                    aiEvaluation: application.aiEvaluation
                })
            });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        }
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || sendingMessage) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setSendingMessage(true);

        // Add user message to chat
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const res = await fetch('/api/ai/interview-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    context: {
                        candidateName: interview?.application?.user?.name,
                        jobTitle: interview?.application?.job?.title,
                        resumeContent: interview?.application?.resumeContent,
                        existingQuestions: questions
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
            }
        } catch (error) {
            console.error("Failed to send chat message", error);
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setSendingMessage(false);
        }
    };

    const toggleQuestion = (index: number) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (!client || !call) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-white">Failed to join interview</h1>
                    <Button onClick={() => router.push("/dashboard")}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgb(15 23 42);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(51 65 85);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(71 85 105);
                }
            `}</style>
            <StreamVideo client={client}>
                <StreamTheme>
                    <StreamCall call={call}>
                        <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
                            {/* Main Video Area */}
                            <div className="flex-1 flex flex-col min-w-0">
                                {/* Header */}
                                <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-800 h-16 shrink-0">
                                    <div>
                                        <h1 className="font-semibold text-lg truncate">
                                            {interview?.application?.job?.title || "Interview"}
                                        </h1>
                                        <p className="text-slate-400 text-sm truncate">
                                            with {interview?.application?.user?.name || "Candidate"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-slate-400 text-sm bg-slate-800 px-3 py-1 rounded-full hidden md:block">
                                            {new Date(interview?.scheduledAt).toLocaleString()}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSidebarOpen(!sidebarOpen)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Video Grid */}
                                <div className="flex-1 relative overflow-hidden p-4">
                                    <SpeakerLayout participantsBarPosition="bottom" />
                                </div>

                                {/* Controls Bar */}
                                <div className="bg-slate-900 p-4 flex justify-center items-center gap-4 border-t border-slate-800 h-20 shrink-0">
                                    <CallControls onLeave={() => {
                                        router.push('/dashboard');
                                        toast.info("Left the interview");
                                    }} />
                                    <CallStatsButton />
                                </div>
                            </div>

                            {/* Sidebar - Interview Assistant */}
                            {sidebarOpen && (
                                <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 transition-all duration-300">
                                    <div className="p-4 border-b border-slate-800">
                                        <h2 className="font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-purple-400" />
                                            Interview Assistant
                                        </h2>
                                    </div>

                                    <Tabs defaultValue="questions" className="flex-1 flex flex-col overflow-hidden">
                                        <TabsList className="w-full bg-slate-800 rounded-none p-0 h-12 shrink-0">
                                            <TabsTrigger value="questions" className="flex-1 h-full rounded-none data-[state=active]:bg-slate-900 data-[state=active]:text-purple-400">
                                                <MessageSquare className="h-4 w-4 mr-2" /> Questions
                                            </TabsTrigger>
                                            <TabsTrigger value="chat" className="flex-1 h-full rounded-none data-[state=active]:bg-slate-900 data-[state=active]:text-green-400">
                                                <Send className="h-4 w-4 mr-2" /> AI Chat
                                            </TabsTrigger>
                                            <TabsTrigger value="info" className="flex-1 h-full rounded-none data-[state=active]:bg-slate-900 data-[state=active]:text-blue-400">
                                                <FileText className="h-4 w-4 mr-2" /> Info
                                            </TabsTrigger>
                                        </TabsList>

                                        <div className="flex-1 overflow-hidden bg-slate-900">
                                            <TabsContent value="questions" className="h-full m-0">
                                                <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                                                    {!questions ? (
                                                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                            <p className="text-sm">Generating questions...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6 pb-4">
                                                            {questions.technical?.length > 0 && (
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wider sticky top-0 bg-slate-900 py-2 z-10">Technical</h3>
                                                                    <div className="space-y-3">
                                                                        {questions.technical.map((q: any, i: number) => (
                                                                            <Card key={i} className="bg-slate-800 border-slate-700">
                                                                                <CardContent className="p-3">
                                                                                    <p className="text-sm text-slate-200 font-medium">{q.question}</p>
                                                                                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                                                        <p className="text-xs text-slate-500 mb-1"><span className="text-slate-400">Relevance:</span> {q.relevance}</p>
                                                                                        <p className="text-xs text-slate-500"><span className="text-slate-400">Look for:</span> {q.goodAnswer}</p>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {questions.behavioral?.length > 0 && (
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider sticky top-0 bg-slate-900 py-2 z-10">Behavioral</h3>
                                                                    <div className="space-y-3">
                                                                        {questions.behavioral.map((q: any, i: number) => (
                                                                            <Card key={i} className="bg-slate-800 border-slate-700">
                                                                                <CardContent className="p-3">
                                                                                    <p className="text-sm text-slate-200 font-medium">{q.question}</p>
                                                                                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                                                        <p className="text-xs text-slate-500 mb-1"><span className="text-slate-400">Relevance:</span> {q.relevance}</p>
                                                                                        <p className="text-xs text-slate-500"><span className="text-slate-400">Look for:</span> {q.goodAnswer}</p>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {questions.problemSolving?.length > 0 && (
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wider sticky top-0 bg-slate-900 py-2 z-10">Problem Solving</h3>
                                                                    <div className="space-y-3">
                                                                        {questions.problemSolving.map((q: any, i: number) => (
                                                                            <Card key={i} className="bg-slate-800 border-slate-700">
                                                                                <CardContent className="p-3">
                                                                                    <p className="text-sm text-slate-200 font-medium">{q.question}</p>
                                                                                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                                                        <p className="text-xs text-slate-500 mb-1"><span className="text-slate-400">Relevance:</span> {q.relevance}</p>
                                                                                        <p className="text-xs text-slate-500"><span className="text-slate-400">Look for:</span> {q.goodAnswer}</p>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="info" className="h-full m-0">
                                                <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                                                    <div className="space-y-6 pb-4">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-400 mb-2">Summary</h3>
                                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                                {interview?.application?.resumeContent?.summary || "No summary available."}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-400 mb-2">Skills</h3>
                                                            <div className="flex flex-wrap gap-2">
                                                                {interview?.application?.resumeContent?.skills?.map((skill: string, i: number) => (
                                                                    <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700">
                                                                        {skill}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-400 mb-2">Experience</h3>
                                                            <div className="space-y-4">
                                                                {interview?.application?.resumeContent?.experience?.map((exp: any, i: number) => (
                                                                    <div key={i} className="border-l-2 border-slate-700 pl-3">
                                                                        <h4 className="text-sm font-medium text-white">{exp.position}</h4>
                                                                        <p className="text-xs text-slate-400">{exp.company} • {exp.startDate} - {exp.endDate}</p>
                                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exp.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-400 mb-2">Education</h3>
                                                            <div className="space-y-3">
                                                                {interview?.application?.resumeContent?.education?.map((edu: any, i: number) => (
                                                                    <div key={i} className="border-l-2 border-slate-700 pl-3">
                                                                        <h4 className="text-sm font-medium text-white">{edu.degree}</h4>
                                                                        <p className="text-xs text-slate-400">{edu.school} • {edu.year}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    </StreamCall>
                </StreamTheme>
            </StreamVideo>
        </>
    );
}
