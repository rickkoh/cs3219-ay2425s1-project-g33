"use client";

import { UserProfile } from "@/types/User";
import { createContext, useCallback, useContext, useState } from "react";

interface OnboardMultiStepFormContextType {
  userProfile: UserProfile | null;
  totalSteps: number;
  currStep: number;
  nextStep: () => void;
  prevStep: () => void;
  updateUser: (val: UserProfile) => void;
}

const defaultValues: OnboardMultiStepFormContextType = {
  userProfile: null,
  totalSteps: 3,
  currStep: 1,
  nextStep: () => {},
  prevStep: () => {},
  updateUser: () => {},
};

export const OnboardMultiStepFormContext =
  createContext<OnboardMultiStepFormContextType>(defaultValues);

export function useOnboardMultiStepFormContext() {
  return useContext(OnboardMultiStepFormContext);
}

export function OnboardMultiStepFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currStep, setCurrStep] = useState<number>(defaultValues.currStep);
  const [userProfile, setUser] = useState<UserProfile | null>(defaultValues.userProfile);

  const nextStep = useCallback(() => {
    setCurrStep((prevCurrStep) =>
      Math.min(prevCurrStep + 1, defaultValues.totalSteps)
    );
  }, []);

  const prevStep = useCallback(() => {
    setCurrStep((prevCurrStep) => Math.max(prevCurrStep - 1, 1));
  }, []);

  const updateUser = useCallback((updatedUser: UserProfile) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUser,
    }));
  }, []);

  return (
    <OnboardMultiStepFormContext.Provider
      value={{
        userProfile,
        totalSteps: defaultValues.totalSteps,
        currStep,
        nextStep,
        prevStep,
        updateUser,
      }}
    >
      {children}
    </OnboardMultiStepFormContext.Provider>
  );
}
