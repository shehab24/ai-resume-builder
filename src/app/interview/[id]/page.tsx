"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    StreamTheme,
    SpeakerLayout,
    CallControls,
    CallStatsButton
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Button } from "@/components/ui/button";
import { Loader2, User, FileText, MessageSquare, ChevronRight, ChevronLeft, Send, ChevronDown, ChevronUp, ClipboardList, Save, Sparkles, Mic, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { useUser } from "@clerk/nextjs";

export default function InterviewRoomPage() {
    const { user } = useUser();
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;
    const chatEndRef = useRef<HTMLDivElement>(null);

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

    // Interview Notes State
    const [interviewMarks, setInterviewMarks] = useState('');
    const [technicalMarks, setTechnicalMarks] = useState('');
    const [behavioralMarks, setBehavioralMarks] = useState('');
    const [salaryDiscussed, setSalaryDiscussed] = useState('');
    const [benefits, setBenefits] = useState('');
    const [startDate, setStartDate] = useState('');
    const [keyTopics, setKeyTopics] = useState('');
    const [interviewNotes, setInterviewNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [isRecruiter, setIsRecruiter] = useState(false);
    const [generatingNotes, setGeneratingNotes] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        initializeCall();
        return () => {
            if (call) call.leave();
            if (client) client.disconnectUser();
        };
    }, [interviewId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const initializeCall = async () => {
        try {
            const res = await fetch(`/api/interviews/${interviewId}/token`);
            if (!res.ok) throw new Error("Failed to get interview details");

            const data = await res.json();
            const { token, apiKey, callId, userId, userName } = data;

            const videoClient = new StreamVideoClient({
                apiKey,
                user: { id: userId, name: userName },
                token,
            });

            setClient(videoClient);

            const videoCall = videoClient.call('default', callId);
            await videoCall.join({ create: true });

            try {
                await videoCall.camera.enable();
                await videoCall.microphone.enable();
            } catch (e) {
                console.error("Failed to enable devices:", e);
            }

            setCall(videoCall);

            const interviewRes = await fetch(`/api/interviews/${interviewId}`);
            if (interviewRes.ok) {
                const interviewData = await interviewRes.json();
                setInterview(interviewData);
                setIsRecruiter(interviewData.isRecruiter || false);
                loadNotes(interviewData);

                if (interviewData.application && interviewData.isRecruiter) {
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
                setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
            }
        } catch (error) {
            console.error("Failed to send message", error);
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
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

    const loadNotes = (interviewData: any) => {
        if (interviewData.interviewMarks) setInterviewMarks(interviewData.interviewMarks.toString());
        if (interviewData.technicalMarks) setTechnicalMarks(interviewData.technicalMarks.toString());
        if (interviewData.behavioralMarks) setBehavioralMarks(interviewData.behavioralMarks.toString());
        if (interviewData.salaryDiscussed) setSalaryDiscussed(interviewData.salaryDiscussed);
        if (interviewData.benefits) setBenefits(interviewData.benefits);
        if (interviewData.startDate) setStartDate(interviewData.startDate);
        if (interviewData.keyTopics) setKeyTopics(interviewData.keyTopics.join(', '));
        if (interviewData.interviewNotes) setInterviewNotes(interviewData.interviewNotes);
    };

    const saveNotes = async () => {
        setSavingNotes(true);
        try {
            const res = await fetch(`/api/interviews/${interviewId}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewMarks: interviewMarks ? parseInt(interviewMarks) : null,
                    technicalMarks: technicalMarks ? parseInt(technicalMarks) : null,
                    behavioralMarks: behavioralMarks ? parseInt(behavioralMarks) : null,
                    salaryDiscussed: salaryDiscussed || null,
                    benefits: benefits || null,
                    startDate: startDate || null,
                    keyTopics: keyTopics ? keyTopics.split(',').map(t => t.trim()).filter(Boolean) : [],
                    interviewNotes: interviewNotes || null
                })
            });

            if (res.ok) {
                toast.success("Notes saved successfully!");
            } else {
                toast.error("Failed to save notes");
            }
        } catch (error) {
            console.error("Failed to save notes", error);
            toast.error("Failed to save notes");
        } finally {
            setSavingNotes(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) {
            toast.error("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                setInterviewNotes(prev => (prev || '') + ' ' + finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        toast.success("Listening... Speak to take notes.");
    };

    // Meeting Chat Logic - Using Stream's built-in chat
    const [meetingMessages, setMeetingMessages] = useState<{ id: string, senderId?: string, sender: string, text: string, timestamp: number }[]>([]);
    const [meetingInput, setMeetingInput] = useState("");

    useEffect(() => {
        if (!call) return;

        const handleChatMessage = (event: any) => {
            console.log("🔔 NEW CODE - CUSTOM EVENT RECEIVED:", event);

            // Stream nests the data: event.custom.custom contains our message
            let msg = event.custom?.custom || event.custom;

            console.log("🔍 Extracted message data:", msg);
            console.log("🔍 Has ID?", !!msg?.id);
            console.log("🔍 Has text?", !!msg?.text);
            console.log("🔍 Message ID:", msg?.id);
            console.log("🔍 Message text:", msg?.text);

            // Handle stringified JSON
            if (typeof msg === 'string') {
                try { msg = JSON.parse(msg); } catch (e) { console.error(e); }
            }

            // Check if it's a meeting-chat message with valid data
            if (msg && msg.id && msg.text) {
                console.log("✅ VALID MESSAGE - Adding to state");
                console.log("Current messages count:", meetingMessages.length);

                setMeetingMessages(prev => {
                    console.log("📝 Inside setState, prev length:", prev.length);

                    // Deduplicate based on ID
                    const isDuplicate = prev.some(m => m.id === msg.id);
                    console.log("Is duplicate?", isDuplicate);

                    if (isDuplicate) {
                        console.log("⚠️ Duplicate message, skipping");
                        return prev;
                    }

                    const newMessages = [...prev, msg];
                    console.log("📨 Adding message, new length:", newMessages.length);
                    return newMessages;
                });
            } else {
                console.log("❌ INVALID message - missing id or text");
                console.log("Message object:", msg);
            }
        };

        console.log("🎯 Setting up custom event listener");
        call.on('custom', handleChatMessage);

        return () => {
            console.log("🧹 Cleaning up custom event listener");
            call.off('custom', handleChatMessage);
        };
    }, [call, meetingMessages.length]);

    const sendMeetingMessage = async () => {
        console.log("=== SEND MESSAGE CALLED ===");
        console.log("Input:", meetingInput);
        console.log("Call exists:", !!call);
        console.log("Call object:", call);

        if (!meetingInput.trim() || !call) {
            console.log("❌ Validation failed - empty input or no call");
            if (!meetingInput.trim()) toast.error("Please type a message");
            if (!call) toast.error("Not connected to call");
            return;
        }

        const messageText = meetingInput;
        const msgId = Math.random().toString(36).substring(7) + Date.now();

        // Use actual user name instead of role
        const userName = user?.fullName || user?.firstName || (isRecruiter ? 'Recruiter' : 'Candidate');

        // Create message object
        const newMessage = {
            id: msgId,
            senderId: user?.id || 'anonymous',
            sender: userName,
            text: messageText,
            timestamp: Date.now()
        };

        // Add to local state immediately for instant feedback
        setMeetingMessages(prev => [...prev, newMessage]);
        setMeetingInput("");

        try {
            console.log("📤 Attempting to send message...");
            console.log("Message object:", newMessage);

            // Try Stream's sendCustomEvent as a reliable fallback
            const result = await call.sendCustomEvent({
                type: 'meeting-chat',
                custom: newMessage
            });

            console.log("✅ Message sent successfully!", result);
            toast.success("Message sent!");
        } catch (error: any) {
            console.error("❌ SEND FAILED:", error);
            console.error("Error type:", typeof error);
            console.error("Error name:", error?.name);
            console.error("Error message:", error?.message);
            toast.error(`Send failed: ${error?.message || 'Unknown error'}`);

            // Remove the optimistically added message on error
            setMeetingMessages(prev => prev.filter(m => m.id !== msgId));
            setMeetingInput(messageText); // Restore input
        }
    };

    const generateNotes = async () => {
        setGeneratingNotes(true);
        try {
            const res = await fetch('/api/ai/generate-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeContent: interview?.application?.resumeContent,
                    jobTitle: interview?.application?.job?.title,
                    jobRequirements: interview?.application?.job?.tasks,
                    currentNotes: interviewNotes
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.technicalMarks) setTechnicalMarks(data.technicalMarks.toString());
                if (data.behavioralMarks) setBehavioralMarks(data.behavioralMarks.toString());
                if (data.salaryDiscussed) setSalaryDiscussed(data.salaryDiscussed);
                if (data.benefits) setBenefits(data.benefits);
                if (data.startDate) setStartDate(data.startDate);
                if (data.keyTopics) setKeyTopics(data.keyTopics.join(', '));
                if (data.interviewNotes) setInterviewNotes(prev => prev ? prev + '\n\n--- AI Summary ---\n' + data.interviewNotes : data.interviewNotes);
                toast.success("Notes generated from resume & transcript!");
            } else {
                toast.error("Failed to generate notes");
            }
        } catch (error) {
            console.error("Failed to generate notes", error);
            toast.error("Failed to generate notes");
        } finally {
            setGeneratingNotes(false);
        }
    };

    const processAndSaveNotes = async () => {
        setSavingNotes(true);
        try {
            toast.info("Analyzing meeting transcript...");
            const genRes = await fetch('/api/ai/generate-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeContent: interview?.application?.resumeContent,
                    jobTitle: interview?.application?.job?.title,
                    jobRequirements: interview?.application?.job?.tasks,
                    currentNotes: interviewNotes
                })
            });

            if (!genRes.ok) throw new Error("Failed to analyze notes");
            const aiData = await genRes.json();

            toast.info("Saving structured notes...");
            const saveRes = await fetch(`/api/interviews/${interviewId}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewMarks: aiData.technicalMarks,
                    technicalMarks: aiData.technicalMarks,
                    behavioralMarks: aiData.behavioralMarks,
                    salaryDiscussed: aiData.salaryDiscussed,
                    benefits: aiData.benefits,
                    startDate: aiData.startDate,
                    keyTopics: aiData.keyTopics,
                    interviewNotes: (interviewNotes || '') + '\n\n--- AI Summary ---\n' + aiData.interviewNotes
                })
            });

            if (saveRes.ok) {
                toast.success("Meeting notes processed and saved!");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to process notes");
        } finally {
            setSavingNotes(false);
        }
    };

    const handleLeaveCall = async () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        if (isRecruiter && interviewNotes) {
            await processAndSaveNotes();
        }

        router.push(`/dashboard/${isRecruiter ? 'recruiter' : 'job-seeker'}`);
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

    const allQuestions = [
        ...(questions?.technical?.map((q: any, i: number) => ({ ...q, type: 'Technical', index: i, color: 'blue' })) || []),
        ...(questions?.behavioral?.map((q: any, i: number) => ({ ...q, type: 'Behavioral', index: i + 1000, color: 'purple' })) || []),
        ...(questions?.problemSolving?.map((q: any, i: number) => ({ ...q, type: 'Problem', index: i + 2000, color: 'green' })) || [])
    ];

    return (
        <>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgb(15 23 42);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(51 65 85);
                    border-radius: 3px;
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
                                    <div className="min-w-0">
                                        <h1 className="font-semibold text-lg truncate">
                                            {interview?.application?.job?.title || "Interview"}
                                        </h1>
                                        <p className="text-slate-400 text-sm truncate">
                                            with {isRecruiter
                                                ? (interview?.application?.user?.name || "Candidate")
                                                : (interview?.application?.job?.recruiter?.name || "Recruiter")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
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
                                    <CallControls onLeave={handleLeaveCall} />

                                    {isRecruiter && (
                                        <Button
                                            onClick={toggleListening}
                                            variant={isListening ? "destructive" : "secondary"}
                                            size="icon"
                                            className={`rounded-full h-10 w-10 ${isListening ? "animate-pulse ring-2 ring-red-500/50" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
                                            title={isListening ? "Stop AI Note Taker" : "Start AI Note Taker"}
                                        >
                                            {isListening ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-purple-400" />}
                                        </Button>
                                    )}

                                    <CallStatsButton />
                                </div>
                            </div>

                            {/* Sidebar - Interview Assistant */}
                            {sidebarOpen && (
                                <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
                                    <div className="p-4 border-b border-slate-800 shrink-0">
                                        <h2 className="font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-purple-400" />
                                            Interview Assistant
                                        </h2>
                                    </div>

                                    <Tabs defaultValue={isRecruiter ? "questions" : "info"} className="flex-1 flex flex-col min-h-0">
                                        <TabsList className="flex w-full h-12 p-1.5 bg-slate-950/40 border-b border-slate-800/60 gap-1">
                                            {isRecruiter ? (
                                                <>
                                                    <TabsTrigger
                                                        value="questions"
                                                        className="flex-1 h-full rounded-md text-[10px] font-medium transition-all data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/20 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                                    >
                                                        <FileText className="h-3.5 w-3.5 mr-1.5" /> Questions
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="ai-chat"
                                                        className="flex-1 h-full rounded-md text-[10px] font-medium transition-all data-[state=active]:bg-green-500/10 data-[state=active]:text-green-400 data-[state=active]:border-green-500/20 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                                    >
                                                        <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Assist
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="info"
                                                        className="flex-1 h-full rounded-md text-[10px] font-medium transition-all data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/20 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                                    >
                                                        <User className="h-3.5 w-3.5 mr-1.5" /> Candidate
                                                    </TabsTrigger>
                                                </>
                                            ) : (
                                                <>
                                                    <TabsTrigger
                                                        value="info"
                                                        className="flex-1 h-full rounded-md text-[10px] font-medium transition-all data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/20 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                                    >
                                                        <User className="h-3.5 w-3.5 mr-1.5" /> My Info
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="job"
                                                        className="flex-1 h-full rounded-md text-[10px] font-medium transition-all data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-400 data-[state=active]:border-orange-500/20 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                                    >
                                                        <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Job
                                                    </TabsTrigger>
                                                </>
                                            )}
                                            <TabsTrigger
                                                value="chat"
                                                className="flex-1 h-full rounded-md text-[10px] font-medium transition-all data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:border-slate-700 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Chat
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Questions Tab - Recruiter Only */}
                                        {isRecruiter && (
                                            <TabsContent value="questions" className="flex-1 m-0 overflow-y-auto p-3 custom-scrollbar data-[state=inactive]:hidden">
                                                {!questions ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                        <p className="text-xs">Generating questions...</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {allQuestions.map((q) => {
                                                            const isExpanded = expandedQuestions.has(q.index);
                                                            const colorClasses = {
                                                                blue: 'border-blue-500/20 text-blue-400',
                                                                purple: 'border-purple-500/20 text-purple-400',
                                                                green: 'border-green-500/20 text-green-400'
                                                            };
                                                            return (
                                                                <div key={q.index} className={`border ${colorClasses[q.color as keyof typeof colorClasses].split(' ')[0]} rounded-lg bg-slate-800/50 overflow-hidden`}>
                                                                    <button
                                                                        onClick={() => toggleQuestion(q.index)}
                                                                        className="w-full p-2.5 flex items-start gap-2 hover:bg-slate-800 transition-colors text-left"
                                                                    >
                                                                        <span className={`${colorClasses[q.color as keyof typeof colorClasses].split(' ')[1]} font-mono text-[10px] mt-0.5 shrink-0`}>
                                                                            {q.type[0]}{(q.index % 1000) + 1}
                                                                        </span>
                                                                        <p className="text-xs text-slate-200 font-medium flex-1 leading-snug">{q.question}</p>
                                                                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />}
                                                                    </button>
                                                                    {isExpanded && (
                                                                        <div className="px-2.5 pb-2.5 pt-1 border-t border-slate-700/50 bg-slate-900/50 space-y-1.5">
                                                                            <p className="text-[10px] text-slate-400"><span className="font-semibold">Why:</span> {q.relevance}</p>
                                                                            <p className="text-[10px] text-slate-500"><span className="font-semibold text-slate-400">Look for:</span> {q.goodAnswer}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </TabsContent>
                                        )}

                                        {/* AI Chat Tab - Recruiter Only */}
                                        {isRecruiter && (
                                            <TabsContent value="ai-chat" className="flex-1 m-0 flex flex-col min-h-0 data-[state=inactive]:hidden">
                                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                                    {chatMessages.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
                                                            <Send className="h-8 w-8 mb-2 text-slate-600" />
                                                            <p className="text-xs font-medium mb-1">AI Interview Assistant</p>
                                                            <p className="text-[10px] text-slate-500">Ask for follow-up questions or interview tips</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {chatMessages.map((msg, i) => (
                                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                    <div className={`max-w-[85%] rounded-lg p-2.5 ${msg.role === 'user'
                                                                        ? 'bg-purple-600 text-white'
                                                                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                                                                        }`}>
                                                                        <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {sendingMessage && (
                                                                <div className="flex justify-start">
                                                                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5">
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div ref={chatEndRef} />
                                                        </>
                                                    )}
                                                </div>
                                                <div className="p-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={chatInput}
                                                            onChange={(e) => setChatInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                                                            placeholder="Ask AI for help..."
                                                            className="flex-1 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 text-xs h-9"
                                                            disabled={sendingMessage}
                                                        />
                                                        <Button
                                                            onClick={sendChatMessage}
                                                            disabled={!chatInput.trim() || sendingMessage}
                                                            size="icon"
                                                            className="bg-purple-600 hover:bg-purple-700 h-9 w-9"
                                                        >
                                                            <Send className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        )}

                                        {/* Candidate Info Tab */}
                                        <TabsContent value="info" className="flex-1 m-0 overflow-y-auto p-3 custom-scrollbar data-[state=inactive]:hidden">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Summary</h3>
                                                    <p className="text-xs text-slate-300 leading-relaxed">
                                                        {interview?.application?.resumeContent?.summary || "No summary available."}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Skills</h3>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {interview?.application?.resumeContent?.skills?.map((skill: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] px-2 py-0.5">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Experience</h3>
                                                    <div className="space-y-3">
                                                        {interview?.application?.resumeContent?.experience?.map((exp: any, i: number) => (
                                                            <div key={i} className="border-l-2 border-slate-700 pl-2">
                                                                <h4 className="text-xs font-medium text-white">{exp.position}</h4>
                                                                <p className="text-[10px] text-slate-400">{exp.company} • {exp.startDate} - {exp.endDate}</p>
                                                                {exp.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{exp.description}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Education</h3>
                                                    <div className="space-y-2">
                                                        {interview?.application?.resumeContent?.education?.map((edu: any, i: number) => (
                                                            <div key={i} className="border-l-2 border-slate-700 pl-2">
                                                                <h4 className="text-xs font-medium text-white">{edu.degree}</h4>
                                                                <p className="text-[10px] text-slate-400">{edu.school} • {edu.year}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="job" className="flex-1 m-0 overflow-y-auto p-3 custom-scrollbar data-[state=inactive]:hidden">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Job Title</h3>
                                                    <p className="text-sm font-medium text-white">{interview?.application?.job?.title}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Description</h3>
                                                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                        {interview?.application?.job?.description}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-semibold text-slate-400 mb-1.5">Requirements</h3>
                                                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                        {interview?.application?.job?.tasks}
                                                    </p>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="chat" className="flex-1 m-0 flex flex-col data-[state=inactive]:hidden">
                                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-3">
                                                {meetingMessages.map((msg, i) => (
                                                    <div key={i} className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}>
                                                        <div className={`max-w-[85%] rounded-lg p-2 text-xs ${msg.senderId === user?.id
                                                            ? 'bg-blue-600 text-white rounded-br-none'
                                                            : 'bg-slate-800 text-slate-200 rounded-bl-none'
                                                            }`}>
                                                            {msg.text}
                                                        </div>
                                                        <span className="text-[9px] text-slate-500 mt-1">
                                                            {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ))}
                                                {meetingMessages.length === 0 && (
                                                    <div className="text-center text-slate-500 text-xs mt-10">
                                                        No messages yet. Start the conversation!
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={meetingInput}
                                                        onChange={(e) => setMeetingInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && sendMeetingMessage()}
                                                        placeholder="Type a message..."
                                                        className="h-9 text-xs bg-slate-800 border-slate-700"
                                                    />
                                                    <Button onClick={sendMeetingMessage} size="icon" className="h-9 w-9 bg-blue-600 hover:bg-blue-700">
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>


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
