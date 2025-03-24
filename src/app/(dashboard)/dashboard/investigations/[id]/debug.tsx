"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DebugInvestigationPage() {
  const params = useParams();
  const investigationId = params?.id?.toString() || '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
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
        
        const result = await response.json();
        console.log('API Response:', result);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    if (investigationId) {
      fetchData();
    }
  }, [investigationId]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Investigation Debug View</h1>
      <h2 className="text-xl font-semibold mb-2">ID: {investigationId}</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[80vh]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
} 