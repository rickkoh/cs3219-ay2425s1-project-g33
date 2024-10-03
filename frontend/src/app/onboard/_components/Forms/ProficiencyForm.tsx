"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { OnboardMultiStepFormContext } from "@/contexts/OnboardMultiStepFormContext";
import { ProficiencyEnum } from "@/types/Proficiency";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoveLeft } from "lucide-react";
import { useCallback, useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
  proficiency: ProficiencyEnum,
});

export default function ProficiencyForm() {
  const { nextStep, prevStep } = useContext(OnboardMultiStepFormContext);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      proficiency: ProficiencyEnum.enum.Beginner,
    },
  });

  const onSubmit = useCallback(() => {
    nextStep();
  }, [nextStep]);

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="text-xl">Select your proficiency level</CardTitle>
        <CardDescription>
          We will match someone of your proficiency level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                className="self-start"
                onClick={(e) => {
                  e.preventDefault();
                  prevStep();
                }}
              >
                <MoveLeft className="stroke-foreground-100 mr-2" />
                Back
              </Button>
              <Button className="w-full max-w-40" type="submit">
                Next
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
