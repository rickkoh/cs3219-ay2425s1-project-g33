"use client";

import StepperComponent from "./_components/StepperComponent";
import UserDetailsForm from "./_components/Forms/UserDetailsForm";
import { useContext } from "react";
import { OnboardMultiStepFormContext } from "@/contexts/OnboardMultiStepFormContext";
import ProficiencyForm from "./_components/Forms/ProficiencyForm";
import LanguagesForm from "./_components/Forms/LanguagesForm";

export default function OnboardPage() {
  const { currStep, totalSteps } = useContext(OnboardMultiStepFormContext);

  return (
    <div className="max-w-md mx-auto">
      <StepperComponent totalSteps={totalSteps} currStep={currStep} />
      {currStep === 1 ? (
        <UserDetailsForm />
      ) : currStep === 2 ? (
        <ProficiencyForm />
      ) : (
        <LanguagesForm />
      )}
    </div>
  );
}
