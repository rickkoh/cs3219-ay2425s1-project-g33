"use client";

import { useFindMatchContext } from "@/contexts/FindMatchContext";

// To be removed
export default function CheatPanel() {
  const {
    isConnected,
    match,
    difficulties: difficulty,
    topics,
    simulateMatchFound,
  } = useFindMatchContext();

  return (
    <div className="fixed z-[99999] p-2 text-black bg-white top-20 left-10">
      <p>Panel</p>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Match: {match ? match : "undefined"}</p>
      <p>Difficulty: {difficulty.join(",")}</p>
      <p>Topics: {topics.join(",")}</p>
      <p></p>
      <div className="flex flex-col gap-4">
        <button onClick={simulateMatchFound}>Simulate match found</button>
        <p>Match auto cancel after 8 seconds</p>
        <p>Match auto confirm after 2 seconds</p>
      </div>
    </div>
  );
}
