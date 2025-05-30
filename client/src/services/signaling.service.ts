import { useSocket } from "@/context/SocketContext";
import { Socket } from "socket.io-client";
// signaling.service.ts
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

export class SignalingService {
  private socket: Socket;
  private currentUserId: string | null = null;
  private userType: "user" | "doctor" | null = null;

  // connect(
  //   userId: string,
  //   userType: "user" | "doctor",
  //   existingSocket?: Socket
  // ) {
  //   if (this.socket?.connected) {
  //     console.log("Signaling already connected");
  //     return;
  //   }

  //   this.currentUserId = userId;
  //   this.userType = userType;

  //   console.log("Connecting signaling service for:", userId, userType);

  //   // Use existing socket if provided, otherwise create new one
  //   this.socket =
  //     existingSocket ||
  //     io(API_BASE_URL, {
  //       query: { userId, userType },
  //     });

  //   this.socket.on("connect", () => {
  //     console.log("Signaling socket connected");
  //     // Send user connect event
  //     this.socket?.emit("user-connect", { userId, userType });
  //   });

  //   this.socket.on("connect_error", (error) => {
  //     console.error("Signaling connection error:", error);
  //   });
  // }
  constructor(socket: Socket) {
    this.socket = socket;
  }

  setUserInfo(userId: string, userType: "user" | "doctor") {
    this.currentUserId = userId;
    this.userType = userType;
  }

  initiateCall(targetUserId: string, targetUserType: "user" | "doctor") {
    if (!this.socket || !this.currentUserId) {
      console.error("Socket not connected or user ID missing");
      return;
    }

    console.log(
      "Initiating call to:",
      targetUserId,
      "from:",
      this.currentUserId
    );

    this.socket.emit("initiate-call", {
      from: this.currentUserId,
      fromType: this.userType,
      to: targetUserId,
      toType: targetUserType,
    });
  }

  sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit) {
    if (!this.socket || !this.currentUserId) return;

    console.log("Sending offer to:", targetUserId);
    this.socket.emit("call-offer", {
      from: this.currentUserId,
      to: targetUserId,
      offer,
    });
  }

  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
    if (!this.socket || !this.currentUserId) return;

    console.log("Sending answer to:", targetUserId);
    this.socket.emit("call-answer", {
      from: this.currentUserId,
      to: targetUserId,
      answer,
    });
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidate) {
    if (!this.socket || !this.currentUserId) return;

    this.socket.emit("ice-candidate", {
      from: this.currentUserId,
      to: targetUserId,
      candidate,
    });
  }

  acceptCall(callerId: string) {
    if (!this.socket || !this.currentUserId) return;

    console.log("Accepting call from:", callerId);
    this.socket.emit("call-accepted", {
      from: this.currentUserId,
      to: callerId,
    });
  }

  rejectCall(callerId: string, reason?: string) {
    if (!this.socket || !this.currentUserId) return;

    console.log("Rejecting call from:", callerId);
    this.socket.emit("call-rejected", {
      from: this.currentUserId,
      to: callerId,
      reason: reason || "declined",
    });
  }

  endCall(targetUserId: string) {
    if (!this.socket || !this.currentUserId) return;

    console.log("Ending call with:", targetUserId);
    this.socket.emit("call-ended", {
      from: this.currentUserId,
      to: targetUserId,
    });
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("Disconnecting signaling service");
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
