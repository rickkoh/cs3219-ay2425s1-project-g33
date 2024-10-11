"use client";

import { PropsWithChildren, createContext, useState, useContext } from "react";
import { io, Socket } from "socket.io-client";
import { Difficulty, DifficultyEnum } from "@/types/Question";
import { Category } from "@/types/Category";

interface FindMatchContextProps {
  isConnected: boolean;
  match?: string;
  findingMatch: boolean;
  matchFound: boolean;
  isAwaitingConfirmation: boolean;
  showConfigurationPanel: boolean;
  difficulties: Difficulty[];
  topics: Category[];
  handleFindMatch: () => void;
  handleCancelFindingMatch: () => void;
  handleConfirmMatch: () => void;
  handleCancelMatch: () => void;
  setShowConfigurationPanel: (show: boolean) => void;
  setDifficulty: (difficulty: Difficulty[]) => void;
  setTopics: (topics: Category[]) => void;
  simulateMatchFound: () => void;
  simulateMatchCancelled: () => void;
  simulateMatchConfirmed: () => void;
}

const MatchContext = createContext<FindMatchContextProps | undefined>(
  undefined
);

export function FindMatchProvider({ children }: PropsWithChildren) {
  const [difficulty, setDifficulty] = useState<Difficulty[]>([
    DifficultyEnum.enum.Medium,
  ]);

  const [showConfigurationPanel, setShowConfigurationPanel] = useState(false);

  const [topics, setTopics] = useState<Category[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const [findingMatch, setFindingMatch] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);

  const [match, setMatch] = useState<string | undefined>();
  const [socket, setSocket] = useState<Socket | undefined>();

  function onConnect() {
    setIsConnected(true);
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  function onMatchFound({ matchInfo }: { matchInfo: string }) {
    setMatch(matchInfo);
    setFindingMatch(false);
    setMatchFound(true);
    setIsAwaitingConfirmation(false);
  }

  function onMatchConfirmed({ matchInfo }: { matchInfo: string }) {
    // Redirect to match session
    console.log("Redirect to:", matchInfo);
    reset();
  }

  function onMatchCancelled() {
    setMatchFound(false);
    setFindingMatch(true);
  }

  function handleFindMatch() {
    connectToSocket();
    setFindingMatch(true);
  }

  function handleCancelFindingMatch() {
    if (!socket) return;
    socket.emit("cancelFindingMatch");
    disconnectFromSocket();
    reset();
  }

  function handleConfirmMatch() {
    if (!socket) return;
    socket.emit("confirmMatch");
    setIsAwaitingConfirmation(true);
    setTimeout(() => {
      simulateMatchConfirmed();
    }, 2000);
  }

  function handleCancelMatch() {
    if (!socket) return;
    socket.emit("cancelMatch");
    disconnectFromSocket();
    reset();
  }

  function connectToSocket() {
    const newSocket = io("http://localhost:4000/match");

    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("matchFound", onMatchFound);
    newSocket.on("matchCancelled", onMatchCancelled);
    newSocket.on("matchConfirmed", onMatchConfirmed);

    setSocket(newSocket);
  }

  function disconnectFromSocket() {
    if (!socket) return;

    socket.off("connect", onConnect);
    socket.off("matchFound", onMatchFound);
    socket.off("matchCancelled", onMatchCancelled);
    socket.off("matchConfirmed", onMatchConfirmed);
    socket.off("disconnect", onDisconnect);
    socket.disconnect();

    setSocket(undefined);
  }

  function reset() {
    setMatch(undefined);
    setFindingMatch(false);
    setMatchFound(false);
    setIsAwaitingConfirmation(false);
  }

  /**
   * To be removed once the socket is implemented
   */
  function simulateMatchFound() {
    onMatchFound({ matchInfo: "Matched user" });
    setTimeout(() => {
      simulateMatchCancelled();
    }, 8000);
  }

  function simulateMatchCancelled() {
    onMatchCancelled();
  }

  function simulateMatchConfirmed() {
    onMatchConfirmed({ matchInfo: "id" });
  }

  const providerValue: FindMatchContextProps = {
    isConnected,
    match,
    findingMatch,
    matchFound,
    isAwaitingConfirmation,
    showConfigurationPanel,
    difficulties: difficulty,
    topics,
    handleFindMatch,
    handleCancelFindingMatch,
    handleConfirmMatch,
    handleCancelMatch,
    setShowConfigurationPanel,
    setDifficulty,
    setTopics,
    simulateMatchFound,
    simulateMatchCancelled,
    simulateMatchConfirmed,
  };

  return (
    <MatchContext.Provider value={providerValue}>
      {children}
    </MatchContext.Provider>
  );
}

export function useFindMatchContext() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error("useFindMatchContext must be used within a MatchProvider");
  }
  return context;
}
