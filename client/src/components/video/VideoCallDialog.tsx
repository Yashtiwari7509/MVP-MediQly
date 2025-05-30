import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { CallState } from "@/hooks/useVideoCall";
import { useEffect } from "react";

interface VideoCallDialogProps {
  isOpen: boolean;
  callState: CallState;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onEndCall: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
}

export const VideoCallDialog = ({
  isOpen,
  callState,
  localVideoRef,
  remoteVideoRef,
  onEndCall,
  onToggleVideo,
  onToggleAudio,
  onAcceptCall,
  onRejectCall,
}: VideoCallDialogProps) => {
  useEffect(() => {
    console.log("VideoCallDialog: State changed", {
      isOpen,
      isReceiving: callState.isReceiving,
      isInitiating: callState.isInitiating,
      isInCall: callState.isInCall,
      callerId: callState.callerId,
      callerName: callState.callerName,
      hasLocalStream: !!callState.localStream,
      hasRemoteStream: !!callState.remoteStream,
    });
  }, [isOpen, callState]);

  // Effect to handle remote stream changes
  useEffect(() => {
    console.log("VideoCallDialog: Remote stream or ref changed");
    if (remoteVideoRef.current && callState.remoteStream) {
      console.log("VideoCallDialog: Setting remote video srcObject");
      remoteVideoRef.current.srcObject = callState.remoteStream;
      remoteVideoRef.current.play().catch((e) => {
        console.error("VideoCallDialog: Error playing remote video:", e);
      });
    } else if (remoteVideoRef.current) {
      console.log("VideoCallDialog: Remote video ref ready, but no stream", {
        hasStream: !!callState.remoteStream,
      });
      remoteVideoRef.current.srcObject = null; // Clear previous stream if any
    } else if (callState.remoteStream) {
      console.log(
        "VideoCallDialog: Remote stream available, but ref not ready",
        { hasRef: !!remoteVideoRef.current }
      );
    } else {
      console.log("VideoCallDialog: Remote video ref and stream not available");
    }
  }, [callState.remoteStream, remoteVideoRef.current]);

  // Effect to handle local stream changes
  useEffect(() => {
    console.log("VideoCallDialog: Local stream or ref changed");
    if (localVideoRef.current && callState.localStream) {
      console.log("VideoCallDialog: Setting local video srcObject");
      localVideoRef.current.srcObject = callState.localStream;
      localVideoRef.current.play().catch((e) => {
        console.error("VideoCallDialog: Error playing local video:", e);
      });
    } else if (localVideoRef.current) {
      console.log("VideoCallDialog: Local video ref ready, but no stream", {
        hasStream: !!callState.localStream,
      });
      localVideoRef.current.srcObject = null; // Clear previous stream if any
    } else if (callState.localStream) {
      console.log(
        "VideoCallDialog: Local stream available, but ref not ready",
        { hasRef: !!localVideoRef.current }
      );
    } else {
      console.log("VideoCallDialog: Local video ref and stream not available");
    }
  }, [callState.localStream, localVideoRef.current]);

  const renderIncomingCallUI = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 p-8 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Animated avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
          <Avatar className="h-40 w-40 border-4 border-white shadow-2xl relative z-10">
            <AvatarImage
              src={`https://i.pravatar.cc/200?img=${callState.callerId}`}
            />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {callState.callerName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Caller info */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">
            {callState.callerName || "Unknown Caller"}
          </h2>
          <p className="text-xl text-blue-200">
            {callState.callerType === "doctor" ? "Doctor" : "Patient"}
          </p>
          <p className="text-lg text-gray-300 animate-pulse">
            📹 Incoming video call
          </p>
        </div>

        {/* Call action buttons */}
        <div className="flex space-x-8 mt-12">
          <Button
            onClick={() => {
              console.log("Reject button clicked");
              onRejectCall?.();
            }}
            className="bg-red-500 hover:bg-red-600 rounded-full h-20 w-20 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            size="lg"
          >
            <PhoneOff className="h-10 w-10" />
          </Button>

          <Button
            onClick={() => {
              console.log("Accept button clicked");
              onAcceptCall?.();
            }}
            className="bg-green-500 touch-auto hover:bg-green-600 rounded-full h-20 w-20 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            size="lg"
          >
            <Phone className="h-10 w-10" />
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
      </div>
    );
  };

  const renderVideoCallUI = () => {
    return (
      <div className="relative h-full w-full bg-black overflow-hidden">
        {/* Remote video (full screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          // muted
          className="w-full h-full object-cover"
          // onLoadedMetadata is less reliable than useEffect for stream changes
          // We rely on the useEffect above to set srcObject
        />

        {/* Local video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-40 h-30 bg-gray-900 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            // muted
            className="w-full h-full object-cover"
            // onLoadedMetadata is less reliable than useEffect for stream changes
            // We rely on the useEffect above to set srcObject
          />
        </div>

        {/* Connection status overlay */}
        {!callState.isInCall && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
              <p className="text-white text-xl font-medium">
                {callState.isInitiating
                  ? "Connecting..."
                  : "Establishing connection..."}
              </p>
              <p className="text-gray-300">
                Connection State: {callState.connectionState || "initializing"}
              </p>
            </div>
          </div>
        )}

        {/* Call controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-6 bg-black/50 backdrop-blur-sm rounded-full px-6 py-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/20 hover:bg-white/30 border-white/30 text-white h-14 w-14"
            onClick={onToggleAudio}
          >
            {callState.isAudioEnabled ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/20 hover:bg-white/30 border-white/30 text-white h-14 w-14"
            onClick={onToggleVideo}
          >
            {callState.isVideoEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-red-500 hover:bg-red-600 border-red-500 text-white h-14 w-14"
            onClick={onEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        {/* Call info overlay */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-white text-sm">
            {callState.isInCall ? "Connected" : "Connecting..."}
          </p>
        </div>
      </div>
    );
  };

  console.log("VideoCallDialog: Rendering with isOpen:", isOpen);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange:", open);
        if (!open) {
          onEndCall();
        }
      }}
    >
      <DialogContent className="max-w-5xl h-[85vh] p-0 border-none overflow-hidden">
        {callState.isReceiving ? renderIncomingCallUI() : renderVideoCallUI()}
      </DialogContent>
    </Dialog>
  );
};
