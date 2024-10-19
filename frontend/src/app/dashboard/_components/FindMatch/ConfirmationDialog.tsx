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
import { UserProfile } from "@/types/User";
import { getInitialsFromName } from "@/lib/utils";
import { useCountdown } from "usehooks-ts";
import { useEffect } from "react";

interface ConfirmationDialogProps {
  user: UserProfile;

}

export default function ConfirmationDialog({ user }: ConfirmationDialogProps) {
  const {
    matchFound,
    matchUsername,
    isAwaitingConfirmation,
    handleDeclineMatch,
    handleAcceptMatch,
  } = useFindMatchContext();
  
  const [counter, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 10,
      intervalMs: 1000,
      isIncrement: false,
    });

  // onComplete logic here
  useEffect(() => {
    if (counter === 0) {
      handleDeclineMatch();
    }
  }, [counter]);

  useEffect(() => {
    if (matchFound) {
      startCountdown();
    } else {
      stopCountdown();
      resetCountdown();
    }
  }, [matchFound]);

  return (
    <AlertDialog open={matchFound}>
      <AlertDialogContent className="flex flex-col gap-12">
        <AlertDialogHeader>
          <AlertDialogTitle>
            You have found a match ({counter}s)
          </AlertDialogTitle>
          <AlertDialogDescription>
            Once you have accepted the match, you will be redirected to another
            page
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-row items-end justify-center w-full gap-4">
          <Avatar>
            <AvatarImage />
            <AvatarFallback>
              {getInitialsFromName(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <Ellipsis />
          <Avatar>
            <AvatarImage />
            <AvatarFallback>
              {matchUsername ? getInitialsFromName(matchUsername) : "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDeclineMatch}>
            Decline
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isAwaitingConfirmation}
            onClick={handleAcceptMatch}
          >
            {isAwaitingConfirmation
              ? "Waiting for other user to accept"
              : "Accept Match"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
