// "use client";

import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
import { PropsWithChildren } from "react";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Toaster />
    </>
  );
}
