import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-dropdown-menu";
import React from "react";

interface Activatable {
    isActive: boolean;
}

interface StepperComponentProps {
  totalSteps: number;
  currStep: number;
}

export default function StepperComponent({
  totalSteps,
  currStep,
}: StepperComponentProps) {
  return (
    <div className="flex items-center gap-1 px-2">
      {Array.from({ length: totalSteps }, (e, i) => (
        <>
          <StepComponent isActive={i + 1 <= currStep} value={i + 1} key={i} />
          {i < totalSteps - 1 && <SeparatorComponent isActive={(i + 1) < currStep}/>}
        </>
      ))}
    </div>
  );
}

interface StepComponentProps extends Activatable {
  value: number;
}

function StepComponent({ isActive, value }: StepComponentProps) {
  return (
    <div
      className={cn("w-6 h-6 text-center align-middle rounded-full", {
        "bg-primary": isActive,
        "outline outline-1 outline-background-100": !isActive,
      })}
    >
      <small>{value}</small>
    </div>
  );
}

interface SeparatorComponentProps extends Activatable {}

function SeparatorComponent({ isActive }: SeparatorComponentProps) {
    return  <Separator className={cn("flex-1 h-[2px]", {"bg-primary": isActive,"bg-background-100": !isActive})} />
}
