import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const [isReady, setIsReady] = useState(false);
  const { currentUser, currentDoctor, userType } = useAuth();

  const currentId = userType === "user" ? currentUser?._id : currentDoctor?._id;

  useEffect(() => {
    if (!currentId) return;

    const socket = io(API_BASE_URL, {
      query: {
        userId: currentId,
        userType,
      },
    });

    socket.emit("user-connect", {
      userId: currentId,
      userType,
    });

    socketRef.current = socket;
    setIsReady(true);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsReady(false);
    };
  }, [currentId, userType]);

  // Don't render children until socket is ready
  // if (!isReady) {
  //   return null; // or loading spinner
  // }

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
