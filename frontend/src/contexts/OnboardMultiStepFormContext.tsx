"use client";

import { User } from "@/types/User";
import { createContext, useCallback, useState } from "react";

interface OnboardMultiStepFormContextType {
  user: User | null;
  totalSteps: number;
  currStep: number;
  nextStep: () => void;
  prevStep: () => void;
  updateUser: (val: User) => void;
}

const defaultValues: OnboardMultiStepFormContextType = {
  user: null,
  totalSteps: 3,
  currStep: 1,
  nextStep: () => {},
  prevStep: () => {},
  updateUser: () => {},
};

export const OnboardMultiStepFormContext =
  createContext<OnboardMultiStepFormContextType>(defaultValues);

export function OnboardMultiStepFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currStep, setCurrStep] = useState<number>(defaultValues.currStep);
  const [user, setUser] = useState<User | null>(defaultValues.user);

  const nextStep = useCallback(() => {
    setCurrStep((prevCurrStep) =>
      Math.min(prevCurrStep + 1, defaultValues.totalSteps)
    );
  }, []);

  const prevStep = useCallback(() => {
    setCurrStep((prevCurrStep) => Math.max(prevCurrStep - 1, 1));
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUser,
    }));
  }, []);

  return (
    <OnboardMultiStepFormContext.Provider
      value={{
        user,
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
