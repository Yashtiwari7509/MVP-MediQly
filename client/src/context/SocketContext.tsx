import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/auth/AuthProvider";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const { currentUser, currentDoctor, userType } = useAuth();

  const currentId = userType === "user" ? currentUser?._id : currentDoctor?._id;

  useEffect(() => {
    if (!currentId) return;

    // Connect to socket server
    socketRef.current = io(API_BASE_URL, {
      query: {
        userId: currentId,
        userType,
      },
    });

    // Send user connect event
    socketRef.current.emit("user-connect", {
      userId: currentId,
      userType,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentId, userType]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
