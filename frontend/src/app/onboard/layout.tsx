import React from "react";
import Navbar from "@/components/Navbar";
import { OnboardMultiStepFormProvider } from "@/contexts/OnboardMultiStepFormContext";

export default function OnboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isMinimal={true} className="relative mt-8 border-b-0" />
      <div className="flex-1 max-h-20" />
      <main className="flex-1">
        <OnboardMultiStepFormProvider>{children}</OnboardMultiStepFormProvider>
      </main>
    </div>
  );
}
