"use client";

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="mx-auto w-[80%] max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 