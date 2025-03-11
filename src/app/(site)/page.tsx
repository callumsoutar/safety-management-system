"use client";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Benefits from "@/sections/Benefits";
import Header from "@/sections/Header";
import HowItWorks from "@/sections/HowItWorks";
import Pricing from "@/sections/Pricing";
import Testimonials from "@/sections/Testimonials";
import WhyUs from "@/sections/WhyUs";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
	const { user, isLoading } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && user) {
			router.push("/dashboard");
		}
	}, [isLoading, user, router]);

	if (isLoading) {
		return <div className="flex items-center justify-center h-screen">Loading...</div>;
	}

	return (
		<main>
			<div className="bg-[#0D121F] px-[100px] text-white">
				<Navbar />
				<Header />
			</div>
			<Benefits />
			<HowItWorks />
			<WhyUs />
			<Testimonials />
			<Pricing />
			<Footer />
		</main>
	);
}
