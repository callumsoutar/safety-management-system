import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import SupabaseProvider from "@/providers/SupabaseProvider";
import UserProvider from "@/providers/UserProvider";
import { initializeStorage } from '@/lib/supabase/storage';

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

// Initialize storage bucket
try {
	initializeStorage();
} catch (error) {
	console.error('Failed to initialize storage:', error);
}

export const metadata: Metadata = {
	title: "AI2SaaS",
	description: "Create your own AI SaaS",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={font.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange>
					<SupabaseProvider>
						<UserProvider>{children}</UserProvider>
					</SupabaseProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
