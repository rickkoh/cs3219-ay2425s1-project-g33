"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Page() {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>(["hello", "world"]);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  function handleSend() {
    if (socket) {
      socket.emit("message", message);
      setMessage("");
    }
  }

  useEffect(() => {
    const newSocket = io("http://localhost:3000");

    newSocket.on("connect", () => {
      setIsConnected(true);
      setTransport(newSocket.io.engine.transport.name); // You can set transport type here
    });

    newSocket.on("message", (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup function to disconnect the socket when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []); // Only run on mount/unmount

  return (
    <div className="flex flex-col w-full h-full p-24 bg-white text-black">
      <div className="flex flex-col">
        {messages.map((message, index) => (
          <div key={index} className="flex flex-row">
            <div className="flex flex-col">
              <div>{message}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-row mt-auto gap-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 border border-black rounded"
        />
        <button
          className="border border-black rounded-md px-4 py-1"
          onClick={handleSend}
        >
          send
        </button>
      </div>
    </div>
  );
}
