"use client";

import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { useFindMatchContext } from "@/contexts/FindMatchContext";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ellipsis } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export default function ConfirmationDialog() {
  const {
    matchFound,
    isAwaitingConfirmation,
    handleCancelMatch,
    handleConfirmMatch,
  } = useFindMatchContext();

  return (
    <AlertDialog open={matchFound}>
      <AlertDialogContent className="flex flex-col gap-12">
        <AlertDialogHeader>
          <AlertDialogTitle>You have found a match</AlertDialogTitle>
          <AlertDialogDescription>
            Once you have accepted the match, you will be redirected to another
            page
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-row items-end justify-center w-full gap-4">
          <UserAvatar
            userProfile={{
              username: "jmsandiegoo",
              email: "test@gmail.com",
              displayName: "Jm San Diego",
              proficiency: "Advanced",
              languages: ["Python"],
              isOnboarded: true,
              roles: ["user"],
            }}
          />
          <Ellipsis />
          <Avatar>
            <AvatarImage />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelMatch}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isAwaitingConfirmation}
            onClick={handleConfirmMatch}
          >
            {isAwaitingConfirmation
              ? "Awaiting confirmation from other user"
              : "Confirm Match"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
