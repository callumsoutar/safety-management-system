"use client";

import { useUser } from "@/hooks/useUser";
import StatCard from "@/components/dashboard/StatCard";
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons";

export default function Dashboard() {
  const { user } = useUser();
  const username = user?.email?.split('@')[0] || 'user';

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">Welcome back, {username}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Flights This Week" 
          value="23" 
          change="+12%" 
          trend="up" 
          period="from last week" 
        />
        <StatCard 
          title="Flying Hours This Week" 
          value="50" 
          change="+8%" 
          trend="up" 
          period="from last week" 
        />
        <StatCard 
          title="Active Members" 
          value="270" 
          change="-2%" 
          trend="down" 
          period="from last month" 
        />
        <StatCard 
          title="Active Aircraft" 
          value="8" 
          change="+1%" 
          trend="up" 
          period="from last month" 
        />
      </div>
    </div>
  );
} 