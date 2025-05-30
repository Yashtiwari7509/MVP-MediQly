import { useState, useCallback, useRef, useEffect } from "react";
import { WebRTCService } from "@/services/webrtc.service";
import { SignalingService } from "@/services/signaling.service";
import { useToast } from "@/hooks/use-toast";
import { Socket } from "socket.io-client";
import { useSignalingService } from "./useSignalingService";

export interface CallState {
  isInCall: boolean;
  isInitiating: boolean;
  isReceiving: boolean;
  callerId?: string;
  callerName?: string;
  callerType?: "user" | "doctor";
  connectionState: RTCPeerConnectionState | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
}

export const useVideoCall = (
  currentUserId: string,
  userType: "user" | "doctor",
  existingSocket?: Socket
) => {
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isInitiating: false,
    isReceiving: false,
    connectionState: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    remoteStream: null,
    localStream: null,
  });

  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const signalingServiceRef = useRef<SignalingService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const { signaling, isInitialized } = useSignalingService();

  const { toast } = useToast();

  useEffect(() => {
    if (!currentUserId || !userType) {
      console.log(
        "Missing currentUserId or userType, skipping video call setup"
      );
      return;
    }

    if (!isInitialized || !signaling) {
      console.log("Signaling service not initialized yet");
      return;
    }

    console.log(
      "Initializing video call services for:",
      currentUserId,
      userType
    );

    const webrtc = new WebRTCService();

    webrtcServiceRef.current = webrtc;
    signalingServiceRef.current = signaling;

    // Set up WebRTC callbacks
    webrtc.setOnRemoteStream((stream) => {
      console.log("Remote stream received in hook");
      setCallState((prev) => ({ ...prev, remoteStream: stream }));

      if (remoteVideoRef.current) {
        console.log("Setting remote video srcObject");
        remoteVideoRef.current.srcObject = stream;

        remoteVideoRef.current.play().catch((e) => {
          console.error("Error playing remote video:", e);
        });
      }
    });

    webrtc.setOnIceCandidate((candidate) => {
      console.log("ICE candidate generated");
      if (targetUserIdRef.current) {
        signaling.sendIceCandidate(targetUserIdRef.current, candidate);
      }
    });

    webrtc.setOnConnectionStateChange((state) => {
      console.log("WebRTC connection state changed:", state);
      setCallState((prev) => ({ ...prev, connectionState: state }));

      if (state === "connected") {
        console.log("Call connected successfully");
        setCallState((prev) => ({
          ...prev,
          isInCall: true,
          isInitiating: false,
          isReceiving: false,
        }));
        toast({
          title: "Call Connected",
          description: "You are now connected to the call",
        });
      } else if (state === "disconnected" || state === "failed") {
        console.log("Call disconnected or failed");
        endCall();
      }
    });

    // Enhanced incoming call handler
    const handleIncomingCall = (data: any) => {
      console.log("Incoming call received:", data);

      // Store caller information for the UI
      setCallState((prev) => ({
        ...prev,
        isReceiving: true,
        callerId: data.from,
        callerName:
          data.fromName || (data.fromType === "doctor" ? "Doctor" : "Patient"),
        callerType: data.fromType,
      }));

      // Store target for later use
      targetUserIdRef.current = data.from;

      toast({
        title: "Incoming Call",
        description: `${
          data.fromName || (data.fromType === "doctor" ? "Doctor" : "Patient")
        } is calling you`,
        duration: 15000,
      });
    };

    // Enhanced call offer handler for receiving calls
    const handleCallOffer = async (data: any) => {
      console.log("Call offer received:", data);

      try {
        // Store the offer for when user accepts
        pendingOfferRef.current = data.offer;
        targetUserIdRef.current = data.from;

        // If user hasn't seen the incoming call UI yet, show it
        setCallState((prev) => ({
          ...prev,
          isReceiving: true,
          callerId: data.from,
          callerName: prev.callerName || "Unknown Caller",
          callerType: prev.callerType || "user",
        }));
      } catch (error) {
        console.error("Error handling offer:", error);
        toast({
          title: "Call Error",
          description: "Failed to establish call connection",
          variant: "destructive",
        });
      }
    };

    const handleCallAnswer = async (data: any) => {
      console.log("Call answer received:", data);
      try {
        await webrtc.setRemoteDescription(data.answer);
        setCallState((prev) => ({ ...prev, isInitiating: false }));
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    };

    const handleIceCandidate = async (data: any) => {
      console.log("ICE candidate received:", data);
      try {
        const webrtc = webrtcServiceRef.current;
        if (!webrtc) {
          console.error("WebRTC service not initialized");
          return;
        }

        // Check if peer connection is initialized
        if (!webrtc.isPeerConnectionInitialized()) {
          console.log(
            "Peer connection not initialized, queueing ICE candidate"
          );
          pendingIceCandidatesRef.current.push(data.candidate);
          return;
        }

        await webrtc.addIceCandidate(data.candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    };

    const handleCallRejected = () => {
      console.log("Call was rejected");
      setCallState((prev) => ({
        ...prev,
        isInitiating: false,
        isReceiving: false,
      }));
      toast({
        title: "Call Rejected",
        description: "The call was rejected",
        variant: "destructive",
      });
    };

    const handleCallEnded = () => {
      console.log("Call ended by remote party");
      endCall();
    };

    const handleCallAccepted = () => {
      console.log("Call accepted by remote party");
    };

    const handleUserOffline = () => {
      console.log("Target user is offline");
      toast({
        title: "User Offline",
        description: "The user you are trying to call is offline",
        variant: "destructive",
      });
      setCallState((prev) => ({ ...prev, isInitiating: false }));
    };

    const handleUserBusy = () => {
      console.log("Target user is busy");
      toast({
        title: "User Busy",
        description: "The user is currently in another call",
        variant: "destructive",
      });
      setCallState((prev) => ({ ...prev, isInitiating: false }));
    };

    // Attach event listeners
    signaling?.on("incoming-call", handleIncomingCall);
    signaling?.on("call-offer", handleCallOffer);
    signaling?.on("call-answer", handleCallAnswer);
    signaling?.on("ice-candidate", handleIceCandidate);
    signaling?.on("call-rejected", handleCallRejected);
    signaling?.on("call-ended", handleCallEnded);
    signaling?.on("call-accepted", handleCallAccepted);
    signaling?.on("user-offline", handleUserOffline);
    signaling?.on("user-busy", handleUserBusy);

    return () => {
      console.log("Cleaning up video call services");
      signaling?.off("incoming-call", handleIncomingCall);
      signaling?.off("call-offer", handleCallOffer);
      signaling?.off("call-answer", handleCallAnswer);
      signaling?.off("ice-candidate", handleIceCandidate);
      signaling?.off("call-rejected", handleCallRejected);
      signaling?.off("call-ended", handleCallEnded);
      signaling?.off("call-accepted", handleCallAccepted);
      signaling?.off("user-offline", handleUserOffline);
      signaling?.off("user-busy", handleUserBusy);

      signaling.disconnect();
      webrtc.endCall();
    };
  }, [
    currentUserId,
    userType,
    existingSocket,
    toast,
    isInitialized,
    signaling,
  ]);

  const initiateCall = useCallback(
    async (targetUserId: string, targetUserType: "user" | "doctor") => {
      const webrtc = webrtcServiceRef.current;
      const signaling = signalingServiceRef.current;

      if (!webrtc || !signaling) {
        console.error("Services not initialized");
        return;
      }

      try {
        console.log("Initiating call to:", targetUserId, targetUserType);
        setCallState((prev) => ({ ...prev, isInitiating: true }));
        targetUserIdRef.current = targetUserId;

        // Initialize peer connection
        await webrtc.initializePeerConnection();

        // Get user media
        const stream = await webrtc.getUserMedia();
        setCallState((prev) => ({ ...prev, localStream: stream }));

        // Set up local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch((e) => {
            console.error("Error playing local video:", e);
          });
        }

        // Add local stream to peer connection
        webrtc.addLocalStreamToPeerConnection();

        // First initiate the call through signaling
        signaling.initiateCall(targetUserId, targetUserType);

        // Create and send offer
        const offer = await webrtc.createOffer();
        signaling.sendOffer(targetUserId, offer);

        toast({
          title: "Initiating Call",
          description: "Connecting to the other party...",
        });
      } catch (error) {
        console.error("Error initiating call:", error);
        setCallState((prev) => ({ ...prev, isInitiating: false }));
        toast({
          title: "Call Failed",
          description: "Failed to initiate the call",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const acceptCall = useCallback(async () => {
    const webrtc = webrtcServiceRef.current;
    const signaling = signalingServiceRef.current;

    if (!webrtc || !signaling || !callState.callerId) {
      console.error("Cannot accept call: missing services or caller ID");
      return;
    }

    try {
      console.log("Accepting call from:", callState.callerId);

      // Initialize peer connection
      await webrtc.initializePeerConnection();

      // Get user media
      const stream = await webrtc.getUserMedia();
      setCallState((prev) => ({ ...prev, localStream: stream }));

      // Set up local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch((e) => {
          console.error("Error playing local video:", e);
        });
      }

      // Add local stream to peer connection
      webrtc.addLocalStreamToPeerConnection();

      // Set remote description from pending offer
      if (pendingOfferRef.current) {
        await webrtc.setRemoteDescription(pendingOfferRef.current);
        pendingOfferRef.current = null;
      }

      // Add any pending ICE candidates
      console.log(
        "Adding",
        pendingIceCandidatesRef.current.length,
        "pending ICE candidates"
      );
      for (const candidate of pendingIceCandidatesRef.current) {
        try {
          await webrtc.addIceCandidate(candidate);
        } catch (error) {
          console.error("Error adding pending ICE candidate:", error);
        }
      }
      pendingIceCandidatesRef.current = [];

      // Create and send answer
      const answer = await webrtc.createAnswer();
      signaling.sendAnswer(callState.callerId, answer);

      // Accept the call through signaling
      signaling.acceptCall(callState.callerId);

      setCallState((prev) => ({
        ...prev,
        isReceiving: false,
      }));

      toast({
        title: "Call Accepted",
        description: "Connecting to the call...",
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      toast({
        title: "Call Failed",
        description: "Failed to accept the call",
        variant: "destructive",
      });
    }
  }, [callState.callerId, toast]);

  const rejectCall = useCallback(() => {
    const signaling = signalingServiceRef.current;

    if (!signaling || !callState.callerId) {
      console.error(
        "Cannot reject call: missing signaling service or caller ID"
      );
      return;
    }

    console.log("Rejecting call from:", callState.callerId);
    signaling.rejectCall(callState.callerId);

    setCallState((prev) => ({
      ...prev,
      isReceiving: false,
      callerId: undefined,
      callerName: undefined,
      callerType: undefined,
    }));

    pendingOfferRef.current = null;
    targetUserIdRef.current = null;
  }, [callState.callerId]);

  const endCall = useCallback(() => {
    console.log("Ending call");
    const webrtc = webrtcServiceRef.current;
    const signaling = signalingServiceRef.current;

    if (webrtc) {
      webrtc.endCall();
    }

    if (signaling && targetUserIdRef.current) {
      signaling.endCall(targetUserIdRef.current);
    }

    // Stop and clean up local media stream (camera and microphone)
    if (callState.localStream) {
      console.log("Stopping local media tracks");
      callState.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
    }

    // Stop and clean up remote media stream
    if (callState.remoteStream) {
      console.log("Stopping remote media tracks");
      callState.remoteStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    // Clean up video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    targetUserIdRef.current = null;
    pendingOfferRef.current = null;

    setCallState({
      isInCall: false,
      isInitiating: false,
      isReceiving: false,
      connectionState: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      remoteStream: null,
      localStream: null,
    });
  }, [callState.localStream, callState.remoteStream]); // Add dependencies for the streams

  const toggleVideo = useCallback(() => {
    const webrtc = webrtcServiceRef.current;
    if (!webrtc) return;

    const isEnabled = webrtc.toggleVideo();
    setCallState((prev) => ({ ...prev, isVideoEnabled: isEnabled }));
  }, []);

  const toggleAudio = useCallback(() => {
    const webrtc = webrtcServiceRef.current;
    if (!webrtc) return;

    const isEnabled = webrtc.toggleAudio();
    setCallState((prev) => ({ ...prev, isAudioEnabled: isEnabled }));
  }, []);

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    endCall,
    initiateCall,
    acceptCall,
    rejectCall,
    toggleAudio,
    toggleVideo,
  };
};
