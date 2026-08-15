"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Sprout, Leaf, Trees, TreePine, X } from "lucide-react";

interface ExperienceLevel {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  {
    id: "no-experience",
    title: "No Experience",
    description: "Less than 6 months",
    icon: <Leaf className="h-6 w-6" />,
  },
  {
    id: "entry-level",
    title: "Entry-Level",
    description: "6 months to 3 years",
    icon: <Sprout className="h-6 w-6" />,
  },
  {
    id: "mid-level",
    title: "Mid-Level",
    description: "3 to 10 years",
    icon: <Trees className="h-6 w-6" />,
  },
  {
    id: "senior-level",
    title: "Senior-Level",
    description: "10 or more years",
    icon: <TreePine className="h-6 w-6" />,
  },
];

interface ExperienceLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (level: string) => void;
}

export function ExperienceLevelModal({
  isOpen,
  onClose,
  onSelect,
}: ExperienceLevelModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[480px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl"
        showCloseButton={true}
      >
        <div className="relative p-6 md:p-8 bg-white">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center rotate-12">
                <div className="-rotate-12 bg-white p-2.5 rounded-xl shadow-sm border border-orange-100">
                    <Briefcase className="h-6 w-6 text-orange-500" />
                </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
                How much <span className="relative inline-block">
                    work experience
                    <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 8" preserveAspectRatio="none">
                        <path d="M0 5C30 2 70 2 100 5" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" />
                    </svg>
                </span> do you have?
              </h2>
              <p className="text-base text-gray-500 pt-2">
                Select the one that best describes you.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelected(level.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-full border transition-all duration-200 text-left ${
                    selected === level.id
                      ? "border-green-800 bg-green-50/50 shadow-sm"
                      : "border-gray-100 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-2 rounded-full transition-colors ${
                    selected === level.id ? "bg-white text-green-600 shadow-sm" : "bg-gray-50 text-gray-500"
                  }`}>
                    {level.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{level.title}</h3>
                    <p className="text-xs text-gray-500">{level.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full flex justify-end pt-4">
              <Button
                onClick={handleContinue}
                disabled={!selected}
                className={`px-8 py-5 text-base font-semibold rounded-full transition-all duration-300 ${
                  selected 
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
