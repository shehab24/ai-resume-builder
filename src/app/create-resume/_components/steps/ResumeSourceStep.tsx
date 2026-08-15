"use client";

import { Button } from "@/components/ui/button";
import { Plus, Upload, UploadCloud } from "lucide-react";

interface ResumeSourceStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ResumeSourceStep({ onNext, onBack }: ResumeSourceStepProps) {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          How would you like to build your resume?
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Create New Option */}
        <div className="relative group border-2 border-gray-200 rounded-2xl p-8 hover:border-primary transition-all duration-300 bg-white flex flex-col items-center text-center space-y-6 shadow-sm hover:shadow-md">
          <div className="relative">
            <div className="w-16 h-20 border-2 border-gray-800 rounded-lg flex items-center justify-center bg-white relative z-10">
              <Plus className="h-8 w-8 text-gray-800" />
            </div>
            {/* Hand-drawn style highlight */}
            <div className="absolute -top-1 -left-2 w-10 h-10 bg-green-200 rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity" />
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-900 relative inline-block">
              Start with a <span className="relative">
                new
                <svg className="absolute -bottom-1 left-0 w-full" height="4" viewBox="0 0 40 4" preserveAspectRatio="none">
                    <path d="M0 2C10 1 30 1 40 2" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </span> resume
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed px-4">
              Get step-by-step support with expert content suggestions at your fingertips!
            </p>
          </div>

          <Button 
            onClick={onNext}
            className="w-full max-w-[200px] py-6 rounded-full font-bold text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            Create new
          </Button>
        </div>

        {/* Upload Option (Disabled) */}
        <div className="relative group border-2 border-gray-100 rounded-2xl p-8 bg-gray-50/50 flex flex-col items-center text-center space-y-6 opacity-80 cursor-not-allowed grayscale-[0.5]">
          <div className="relative">
            <div className="w-16 h-20 border-2 border-gray-400 rounded-lg flex flex-col items-center justify-center bg-white relative z-10">
              <div className="w-8 h-1 bg-gray-400 rounded-full mb-1" />
              <div className="w-6 h-1 bg-gray-400 rounded-full mb-1" />
              <Upload className="h-4 w-4 text-gray-400 mt-2" />
            </div>
            {/* Hand-drawn style highlight */}
            <div className="absolute -top-1 -left-2 w-10 h-10 bg-blue-200 rounded-full blur-sm opacity-60" />
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-gray-400 relative inline-block">
              Upload an <span className="relative">
                existing
                <svg className="absolute -bottom-1 left-0 w-full" height="4" viewBox="0 0 60 4" preserveAspectRatio="none">
                    <path d="M0 2C15 1 45 1 60 2" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </span> resume
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed px-4">
              Edit your resume using expertly generated content in a fresh, new design.
            </p>
          </div>

          <Button 
            disabled
            variant="outline"
            className="w-full max-w-[200px] py-6 rounded-full font-bold text-lg border-orange-200 text-gray-900 bg-orange-50 hover:bg-orange-100 flex gap-2"
          >
            <UploadCloud className="h-5 w-5" />
            Choose file
          </Button>
          
          <p className="text-[10px] text-gray-400 pt-2 font-medium">
            Acceptable file types: DOC, DOCX, PDF, HTML, RTF, TXT
          </p>
          
          <button className="text-xs text-blue-500 font-semibold hover:underline flex items-center gap-1">
            More upload options <span className="text-[10px]">▼</span>
          </button>
        </div>
      </div>

      <div className="flex justify-start pt-6">
        <Button variant="ghost" onClick={onBack} className="text-gray-500">
          ← Back
        </Button>
      </div>
    </div>
  );
}
