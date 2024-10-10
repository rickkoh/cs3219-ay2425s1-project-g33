"use client";

import { useForm, FormProvider } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { User, Lock } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/services/authService";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { TextInput } from "@/components/form/TextInput";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@radix-ui/react-dropdown-menu";

const FormSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export default function SigninForm() {
  const router = useRouter();

  const { toast } = useToast();

  const methods = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const { handleSubmit, formState } = methods;

  const onSubmit = useCallback(
    async (data: z.infer<typeof FormSchema>) => {
      if (formState.isSubmitting) return;
      const accessTokenResponse = await login(data);
      if (accessTokenResponse.statusCode === 200 && accessTokenResponse.data) {
        localStorage.setItem(
          "access_token",
          accessTokenResponse.data.access_token
        );
        toast({
          title: "Successfully Logged in!",
          description: "You should be redirect to /dashboard",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error!",
          description: accessTokenResponse.message,
        });
        // TODO: Display error message
      }
    },
    [router, toast]
  );

  return (
    <Card className="p-3 mt-3">
      <CardHeader>
        <CardTitle className="text-xl">Welcome!</CardTitle>
        <CardDescription className="text-card-foreground-100">
          Log in to start coding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {/* To input log in details */}
          <Form {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-4">
                {/* Email Field */}
                <TextInput
                  label={""}
                  name="email"
                  placeholder="Email"
                  className="bg-input-background-100"
                />
                <TextInput
                  label={""}
                  name="password"
                  placeholder="Password"
                  className="bg-input-background-100"
                />
              </div>

              {/* Forgot password link */}
              <div className="pt-2 pb-2 text-right">
                <Link
                  href="/forgotpassword"
                  className="text-sm text-primary hover:underline"
                >
                  {" "}
                  Forgot password?{" "}
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full py-2 mt-5 rounded-md bg-primary"
              >
                {formState.isSubmitting ? <LoadingSpinner /> : "Sign in"}
              </Button>
            </form>
          </Form>

          {/* Or sign in with */}
          <div className="flex items-center my-6">
            <Separator className="flex-1 h-[0.5px] bg-card-foreground-100" />
            <span className="mx-2 text-sm">Or sign in with</span>
            <Separator className="flex-1 h-[0.5px] bg-card-foreground-100" />
          </div>

          {/* Socials */}
          <div className="flex flex-row justify-center gap-x-4">
            <button className="rounded-md">{/*<FaGithub size={24}/> */}</button>

            <button className="rounded-md">
              {/* <FaGoogle size={24}/> */}
            </button>
          </div>

          {/* Sign up here */}
          <div className="justify-center mt-6 text-sm text-center">
            <p>
              {" "}
              No account yet? Click here to{" "}
              <Link href="/signup" className="hover:underline text-primary">
                Sign up
              </Link>{" "}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
