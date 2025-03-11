"use client";

import { useUser } from "@/hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TopNav = () => {
  const { user } = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/sign-in");
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";
  // Extract user name from email or use a default
  const userName = user?.email?.split('@')[0] || "User";
  // Capitalize first letter of each word for a more formal display
  const formattedName = userName
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <p className="text-gray-700 font-medium">Hello, {formattedName}!</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center"
            >
              {userInitial}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopNav; 