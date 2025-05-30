import { useSocket } from "@/context/SocketContext";
import { useEffect, useRef, useState } from "react";
import { SignalingService } from "@/services/signaling.service";
import { useAuth } from "@/auth/AuthProvider";

export const useSignalingService = () => {
  const { socket } = useSocket();
  const { currentUser, currentDoctor, userType } = useAuth();
  const signalingRef = useRef<SignalingService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (socket && (currentUser || currentDoctor)) {
      const currentId =
        userType === "user" ? currentUser?._id : currentDoctor?._id;
      if (!currentId) {
        console.error("No current user ID available");
        setIsInitialized(false);
        return;
      }

      const service = new SignalingService(socket);
      service.setUserInfo(currentId, userType);
      signalingRef.current = service;
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [socket, currentUser, currentDoctor, userType]);

  return { signaling: signalingRef.current, isInitialized };
};
