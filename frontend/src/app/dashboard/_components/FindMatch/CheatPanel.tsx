"use client";

import { useFindMatchContext } from "@/contexts/FindMatchContext";

// To be removed
export default function CheatPanel() {
  const {
    isConnected,
    matchId,
    difficulties: difficulty,
    topics,
  } = useFindMatchContext();

  return (
    <div className="fixed z-[99999] p-2 text-black bg-white top-20 left-10">
      <p>Panel</p>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Match: {matchId ? matchId : "undefined"}</p>
      <p>Difficulty: {difficulty.join(",")}</p>
      <p>Topics: {topics.join(",")}</p>
    </div>
  );
}
