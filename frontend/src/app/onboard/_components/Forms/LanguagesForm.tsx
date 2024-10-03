"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardMultiStepFormContext } from "@/contexts/OnboardMultiStepFormContext";
import { LanguageEnum } from "@/types/Languages";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoveLeft } from "lucide-react";
import { useContext } from "react";
import { Form, useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
  languages: z.array(LanguageEnum),
});

export default function LanguagesForm() {
  const { prevStep } = useContext(OnboardMultiStepFormContext);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      languages: [],
    },
  });

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="text-xl">
          Select your preferred programming language(s)
        </CardTitle>
        <CardDescription>
          We will match someone who uses the same language as you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="flex flex-col gap-5">
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
                Done
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
