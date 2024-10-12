import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isMinimal={true} className="relative mt-8 border-b-0" />
      <div className="flex-1 max-h-20" />
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
