"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon, MessageSquareText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Chatbox() {
  const [collapse, setCollapse] = React.useState(false);

  const [messages, setMessages] = React.useState([
    {
      id: 3,
      sender: "Alice",
      content: "Got it! So we map values to their indices?",
    },
    {
      id: 2,
      sender: "Bob",
      content: "Start with brute force, then optimize with a hash map.",
    },
    {
      id: 1,
      sender: "Alice",
      content: "Hey Bob, how should we approach Two Sum?",
    },
  ]);

  const [newMessage, setNewMessage] = React.useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([
        { id: messages.length + 1, sender: "You", content: newMessage },
        ...messages,
      ]);
      setNewMessage("");
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        "relative flex h-full overflow-hidden",
        collapse ? "w-20" : "w-96"
      )}
    >
      <div className="absolute top-0 left-0 flex flex-col h-full w-96">
        <CardHeader className="flex flex-col gap-4 h-fit">
          <div
            className={cn(
              "flex gap-4",
              collapse
                ? "flex-col items-start justify-center"
                : "flex-row items-center justify-start"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCollapse(!collapse);
              }}
              className={cn("mr-2", "transition-all duration-300")}
            >
              {collapse ? <MessageSquareText /> : <ArrowRightIcon />}
            </Button>
            <Avatar className={cn(collapse && "w-8 h-8")}>
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            {!collapse && <div className="ml-auto font-semibold">Chat</div>}
          </div>
        </CardHeader>
        <CardContent
          className={cn(
            "transition-all duration-300",
            "flex flex-col-reverse overflow-scroll whitespace-no-wrap",
            collapse && "opacity-0"
          )}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col mb-4 whitespace-pre-wrap ${
                message.sender === "You" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{message.sender}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-lg ${
                  message.sender === "You"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter
          className={cn(
            "transition-all duration-300",
            "flex mt-auto h-fit whitespace-normal",
            collapse && "opacity-0"
          )}
        >
          <form
            onSubmit={handleSendMessage}
            className="flex items-center w-full space-x-2"
          >
            <Input
              id="message"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </div>
    </Card>
  );
}
