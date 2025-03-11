"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Stage = 
  | "not_started" 
  | "data_collection" 
  | "analysis" 
  | "recommendations" 
  | "review" 
  | "completed";

interface InvestigationProgressProps {
  currentStage: Stage;
}

const stages: { id: Stage; label: string; icon: React.ReactNode }[] = [
  {
    id: "not_started",
    label: "Not Started",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "data_collection",
    label: "Data Collection",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "analysis",
    label: "Analysis",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    id: "recommendations",
    label: "Recommendations",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "review",
    label: "Review",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    id: "completed",
    label: "Completed",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

const getStageIndex = (stage: Stage): number => {
  return stages.findIndex((s) => s.id === stage);
};

const InvestigationProgress = ({ currentStage }: InvestigationProgressProps) => {
  const currentStageIndex = getStageIndex(currentStage);
  const [progressWidth, setProgressWidth] = useState("0%");

  useEffect(() => {
    // Animate the progress bar width
    const width = currentStageIndex === 0
      ? "0%"
      : currentStageIndex === stages.length - 1
      ? "100%"
      : `${(currentStageIndex / (stages.length - 1)) * 100}%`;
    
    // Small delay to allow for animation
    setTimeout(() => {
      setProgressWidth(width);
    }, 100);
  }, [currentStageIndex]);

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-600"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Investigation Progress</h2>
      </div>
      
      <div className="relative mt-8 mb-2">
        {/* Progress track and fill */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200"></div>
        <div 
          className="absolute top-6 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-in-out"
          style={{ width: progressWidth }}
        ></div>
        
        {/* Stage indicators */}
        <div className="flex justify-between relative">
          {stages.map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPast = index < currentStageIndex;

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center"
              >
                {/* Circle indicator */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-500",
                    isCurrent 
                      ? "bg-blue-500 text-white ring-4 ring-blue-100" 
                      : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-400 border-2 border-gray-200"
                  )}
                >
                  {isPast ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    stage.icon
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium text-center max-w-[80px] transition-all duration-500",
                    isCurrent 
                      ? "text-blue-600" 
                      : isActive
                      ? "text-gray-700"
                      : "text-gray-400"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current stage description */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current Stage:</span> {stages[currentStageIndex].label}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvestigationProgress; 