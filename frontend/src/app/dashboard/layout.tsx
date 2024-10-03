import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (  
    <>
      <Navbar />
      <main>{children}</main>
      <Toaster />
    </>
  );
}
