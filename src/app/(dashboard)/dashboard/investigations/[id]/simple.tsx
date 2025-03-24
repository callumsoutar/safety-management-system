"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";

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

export default function SimpleInvestigationPage() {
  const params = useParams();
  const investigationId = params?.id?.toString() || '';
  const [loading, setLoading] = useState(true);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchInvestigation = async () => {
      try {
        setLoading(true);
        console.log('Fetching investigation with ID:', investigationId);
        
        const response = await fetch(`/api/investigations/${investigationId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.investigation) {
          console.error('Investigation data is missing in the response');
          setError('Investigation data not found in the response');
          setLoading(false);
          return;
        }
        
        setInvestigation(data.investigation);
      } catch (err) {
        console.error("Failed to fetch investigation:", err);
        setError(`Failed to load investigation details: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    if (investigationId) {
      fetchInvestigation();
    }
  }, [investigationId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading investigation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">Error</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-700 font-medium mb-2">Not Found</p>
          <p className="text-gray-500">The investigation you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Investigation #{investigation.id}</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Investigation Overview</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="font-medium">{investigation.stage}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Lead Investigator</p>
            <p className="font-medium">{investigation.lead_investigator.full_name}</p>
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
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Findings</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Findings</p>
            <div className="p-4 border rounded" dangerouslySetInnerHTML={{ __html: investigation.findings || '' }}></div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Root Causes</p>
            <div className="p-4 border rounded" dangerouslySetInnerHTML={{ __html: investigation.root_causes || '' }}></div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Contributing Factors</p>
            <div className="p-4 border rounded" dangerouslySetInnerHTML={{ __html: investigation.contributing_factors || '' }}></div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Recommendations</p>
            <div className="p-4 border rounded" dangerouslySetInnerHTML={{ __html: investigation.recommendations || '' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
} 