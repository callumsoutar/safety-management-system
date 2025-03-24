"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { format } from "date-fns";
import useSWR from "swr";
import InvestigationProgress from "@/components/occurrences/InvestigationProgress";

// Types
interface InvestigationParams {
  id: string;
}

interface Investigation {
  id: string;
  occurrence_id: string;
  stage: string;
  lead_investigator_id: string;
  lead_investigator: {
    id: string;
    full_name: string;
    email: string;
  };
  occurrence: {
    id: string;
    occurrence_number: string;
    title: string;
    description: string;
    occurrence_date: string;
    location: string;
    status: string;
    severity: string;
    occurrence_type: string;
    reporter: {
      id: string;
      full_name: string;
      email: string;
    };
    aircraft?: {
      id: string;
      registration: string;
      type: string;
      model: string;
    };
  };
  findings: string | null;
  root_causes: string | null;
  contributing_factors: string | null;
  recommendations: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Interview {
  id: string;
  investigation_id: string;
  interviewee: string;
  date: string;
  summary: string;
  notes: string;
  status: string;
}

interface Communication {
  id: string;
  investigation_id: string;
  type: string;
  date: string;
  participants: string[];
  summary: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
}

interface InvestigationData {
  investigation: Investigation;
  interviews: Interview[];
  communications: Communication[];
}

type TabType = "overview" | "findings" | "interviews" | "communications" | "attachments" | "timeline";

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }
  return response.json();
};

export default function InvestigationPage() {
  const params = useParams();
  const investigationId = params?.id?.toString() || '';
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [findingsForm, setFindingsForm] = useState({
    findings: '',
    root_causes: '',
    contributing_factors: '',
    recommendations: ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR<InvestigationData>(
    investigationId ? `/api/investigations/${investigationId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true
    }
  );

  // Update form when data is loaded
  useEffect(() => {
    if (data?.investigation) {
      setFindingsForm({
        findings: data.investigation.findings || '',
        root_causes: data.investigation.root_causes || '',
        contributing_factors: data.investigation.contributing_factors || '',
        recommendations: data.investigation.recommendations || ''
      });
    }
  }, [data]);

  // Handle content updates for findings form
  const handleFindingsChange = (field: keyof typeof findingsForm, content: string) => {
    setFindingsForm(prev => ({
      ...prev,
      [field]: content
    }));
    setHasUnsavedChanges(true);
  };

  // Save all findings form content
  const handleSaveFindings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/investigations/${investigationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(findingsForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      // Update the cached data
      await mutate({
        ...data!,
        investigation: {
          ...data!.investigation,
          ...findingsForm
        }
      }, false);

      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error updating content:', err);
      // You might want to add toast notifications here
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading investigation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-gray-700 font-medium mb-2">Error</p>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.investigation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-gray-700 font-medium mb-2">Not Found</p>
          <p className="text-gray-500">The investigation you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        </div>
      </div>
    );
  }

  const { investigation, interviews = [], communications = [] } = data;

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Investigation Overview</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="font-medium">{investigation.stage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Lead Investigator</p>
                  <p className="font-medium">
                    {investigation.lead_investigator 
                      ? investigation.lead_investigator.full_name
                      : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Start Date</p>
                  <p className="font-medium">
                    {investigation.started_at 
                      ? format(new Date(investigation.started_at), "MMM d, yyyy")
                      : 'Not started'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Occurrence</p>
                  <p className="font-medium">{investigation.occurrence.occurrence_number}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Occurrence Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Title</p>
                  <p className="font-medium">{investigation.occurrence.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{investigation.occurrence.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium">{investigation.occurrence.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <p className="font-medium">
                      {investigation.occurrence.occurrence_date 
                        ? format(new Date(investigation.occurrence.occurrence_date), "MMM d, yyyy")
                        : 'Date not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Severity</p>
                    <p className="font-medium">{investigation.occurrence.severity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <p className="font-medium">{investigation.occurrence.occurrence_type}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "findings":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Investigation Findings</h2>
              <button
                onClick={handleSaveFindings}
                disabled={!hasUnsavedChanges || isSaving}
                className={`inline-flex items-center px-4 py-2 rounded-md ${
                  hasUnsavedChanges
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                } transition-colors`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Findings</h2>
              <RichTextEditor
                content={findingsForm.findings}
                onChange={(content) => handleFindingsChange('findings', content)}
                placeholder="Document your investigation findings..."
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Root Causes</h2>
              <RichTextEditor
                content={findingsForm.root_causes}
                onChange={(content) => handleFindingsChange('root_causes', content)}
                placeholder="Identify and document root causes..."
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Contributing Factors</h2>
              <RichTextEditor
                content={findingsForm.contributing_factors}
                onChange={(content) => handleFindingsChange('contributing_factors', content)}
                placeholder="List contributing factors..."
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
              <RichTextEditor
                content={findingsForm.recommendations}
                onChange={(content) => handleFindingsChange('recommendations', content)}
                placeholder="Provide safety recommendations..."
              />
            </div>
          </div>
        );

      case "interviews":
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Interviews</h2>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Schedule Interview
              </button>
            </div>
            
            {interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div key={interview.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{interview.interviewee}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(interview.date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        interview.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {interview.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{interview.summary}</p>
                    <div className="flex justify-end">
                      <button className="text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No interviews scheduled yet</p>
              </div>
            )}
          </div>
        );

      case "communications":
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Communications Log</h2>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Log Communication
              </button>
            </div>
            
            {communications.length > 0 ? (
              <div className="space-y-4">
                {communications.map((communication) => (
                  <div key={communication.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{communication.type}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(communication.date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      {communication.follow_up_required && (
                        <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                          Follow-up Required
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{communication.summary}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {communication.participants.map((participant, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                          {participant}
                        </span>
                      ))}
                    </div>
                    {communication.follow_up_notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-500">Follow-up Notes:</p>
                        <p className="text-gray-600">{communication.follow_up_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No communications logged yet</p>
              </div>
            )}
          </div>
        );

      case "attachments":
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Evidence & Attachments</h2>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Upload Files
              </button>
            </div>
            
            {/* Attachment upload and list components will go here */}
            <div className="text-center py-8">
              <p className="text-gray-500">No attachments uploaded yet</p>
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6">Investigation Timeline</h2>
            <div className="space-y-6">
              {/* Timeline items will go here */}
              <div className="flex">
                <div className="flex-shrink-0 w-12">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto"></div>
                  <div className="w-px h-full bg-gray-200 mx-auto"></div>
                </div>
                <div className="-mt-1">
                  <p className="text-sm text-gray-500">March 15, 2024</p>
                  <p className="font-medium">Investigation Initiated</p>
                  <p className="text-gray-600">Initial assessment and team assignment completed</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Investigation #{investigation.id}</h1>
          <p className="text-gray-500">
            {investigation.started_at 
              ? `Started on ${format(new Date(investigation.started_at), "MMMM d, yyyy")}`
              : 'Not yet started'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 mr-2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Add investigation progress bar here */}
      <InvestigationProgress
        currentStage={(investigation.stage || "not_started") as "not_started" | "data_collection" | "analysis" | "recommendations" | "review" | "completed"}
      />
      
      {/* Tab navigation */}
      <div className="mb-6 border-b">
        <div className="flex space-x-4">
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "overview" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "findings" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("findings")}
          >
            Findings
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "interviews" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("interviews")}
          >
            Interviews
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "communications" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("communications")}
          >
            Communications
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "attachments" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("attachments")}
          >
            Evidence
          </button>
          <button 
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "timeline" 
                ? "border-b-2 border-blue-500 text-blue-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("timeline")}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
} 