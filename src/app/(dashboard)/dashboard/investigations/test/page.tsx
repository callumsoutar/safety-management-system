"use client";

import { useEffect, useState } from "react";

export default function TestInvestigationAPI() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/investigations/5c6ac923-e441-4881-ad62-dfb927c2bb2f');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[80vh]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
} 