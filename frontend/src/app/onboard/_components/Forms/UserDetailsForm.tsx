"use client";

import { TextInput } from "@/components/form/TextInput";
import { UserAvatarInput } from "@/components/form/UserAvatarInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FormSchema = z.object({
  profilePicture: z.string(), // TODO: change to actual image file type
  displayName: z.string(),
});

export default function UserDetailsForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      profilePicture: "",
      displayName: "",
    },
  });

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="text-xl">Let's setup your profile</CardTitle>
        <CardDescription>
          Tell us more about yourself so that we can provide you a personalised
          experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="flex flex-col gap-5">
            <UserAvatarInput label="Profile Image" name="profilePicture" />
            <TextInput
              label="Display Name"
              name="displayName"
              placeholder={"Name"}
              className="bg-input-background-100"
            />
            <Button className="self-center max-w-40" type="submit">Next</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
