import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Video, Send, UserCheck, User2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/auth/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import io from "socket.io-client";
import api from "@/utils/api";
import { doctorProfileProps, UserProps } from "@/lib/user.type";
import { useVideoCall } from "@/hooks/useVideoCall";
import { VideoCallDialog } from "@/components/video/VideoCallDialog";
import { useSocket } from "@/context/SocketContext";
const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

// Define types
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isOnline: boolean;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  isOnline: boolean;
}

interface Message {
  _id: string;
  text: string;
  sender: {
    id: string;
    type: "user" | "doctor";
  };
  receiver: {
    id: string;
    type: "user" | "doctor";
  };
  read: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: {
    id: string;
    model: string;
    unreadCount: number;
  }[];
  lastMessage: {
    text: string;
    sender: string;
    timestamp: string;
  };
  messages: Message[];
}

const Chat = () => {
  const queryClient = useQueryClient();
  const { currentUser, currentDoctor, userType } = useAuth();
  const [selectedRecipient, setSelectedRecipient] = useState<
    User | Doctor | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  // const socketRef = useRef<any>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  // Get current user ID and type
  const currentId = userType === "user" ? currentUser?._id : currentDoctor?._id;
  console.log(currentId, "getting current ID");

  // Initialize video call hook with existing socket
  const {
    callState,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  } = useVideoCall(currentId!, userType!, socket);

  // Fetch available doctors/users depending on user type
  const { data: availableUsers } = useQuery({
    queryKey: ["available-users"],
    queryFn: async () => {
      const { data } = await api.get(
        userType === "user" ? "/doctors/available" : "/users/available"
      );
      return data;
    },
    enabled: !!currentId,
  });

  // Fetch user conversations
  const fetchConversations = () => {
    if (!currentId) return;

    socket.emit("get-conversations", { userId: currentId });
    socket.on("user-conversations", (data) => {
      setConversations(data.conversations);
    });
  };

  // Fetch conversations on component mount
  useEffect(() => {
    if (socket) {
      fetchConversations();
    }
  }, [socket]);

  // Fetch chat history when a recipient is selected
  useEffect(() => {
    if (!selectedRecipient || !currentId) return;

    // Find existing conversation or create new one
    const recipientId = selectedRecipient._id;
    const existingConversation = conversations.find((conv) =>
      conv.participants.some((p) => p.id === recipientId)
    );

    if (existingConversation) {
      setCurrentConversation(existingConversation);

      // Fetch messages for this conversation
      socket.emit("get-chat-history", {
        conversationId: existingConversation._id,
      });

      socket.on("chat-history", (data) => {
        if (data.conversationId === existingConversation._id) {
          setMessages(data.messages);

          // Mark messages as read
          socket.emit("mark-messages-read", {
            conversationId: existingConversation._id,
            userId: currentId,
          });
        }
      });
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [selectedRecipient, currentId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRecipient || !currentId) return;

    const recipientId = selectedRecipient._id;
    const recipientType = userType === "user" ? "doctor" : "user";

    // Prepare message data
    const messageData = {
      senderId: currentId,
      receiverId: recipientId,
      text: newMessage,
      senderType: userType,
      receiverType: recipientType,
    };

    // Send message via socket
    socket.emit("send-message", messageData);

    // Clear input
    setNewMessage("");
  };

  // Start video call with enhanced logging
  const startVideoCall = useCallback(async () => {
    if (!selectedRecipient || !currentId) {
      console.error("Cannot start call: missing recipient or current user ID");
      toast({
        title: "Error",
        description: "Please select a recipient first",
        variant: "destructive",
      });
      return;
    }

    if (!socket || !socket.connected) {
      console.error("Socket not connected");
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    const targetUserType = userType === "user" ? "doctor" : "user";

    console.log("Starting video call to:", {
      recipientId: selectedRecipient._id,
      targetUserType,
      currentId,
      socketConnected: socket.connected,
    });

    try {
      await initiateCall(selectedRecipient._id, targetUserType);
    } catch (error) {
      console.error("Video call initiation failed:", error);
      toast({
        title: "Call Failed",
        description:
          error instanceof Error ? error.message : "Failed to start video call",
        variant: "destructive",
      });
    }
  }, [selectedRecipient, currentId, userType, initiateCall, toast]);

  // 4. Enhanced error handling for audio calls
  const startAudioCall = useCallback(async () => {
    if (!selectedRecipient || !currentId) {
      console.error("Cannot start call: missing recipient or current user ID");
      toast({
        title: "Error",
        description: "Please select a recipient first",
        variant: "destructive",
      });
      return;
    }

    if (!socket || !socket.connected) {
      console.error("Socket not connected");
      toast({
        title: "Connection Error",
        description: "Not connected to server. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    const targetUserType = userType === "user" ? "doctor" : "user";

    console.log("Starting audio call to:", {
      recipientId: selectedRecipient._id,
      targetUserType,
      currentId,
      socketConnected: socket.connected,
    });

    try {
      await initiateCall(selectedRecipient._id, targetUserType);
    } catch (error) {
      console.error("Audio call initiation failed:", error);
      toast({
        title: "Call Failed",
        description:
          error instanceof Error ? error.message : "Failed to start audio call",
        variant: "destructive",
      });
    }
  }, [selectedRecipient, currentId, userType, initiateCall, toast]);

  // Helper function to get recipient name
  const getRecipientName = (recipient: User | Doctor) => {
    return `${recipient.firstName} ${recipient.lastName}`;
  };

  // 2. Fix the video call initialization condition
  const isVideoCallOpen = useMemo(() => {
    return (
      callState.isInCall || callState.isInitiating || callState.isReceiving
    );
  }, [callState.isInCall, callState.isInitiating, callState.isReceiving]);

  return (
    <MainLayout>
      <div className="container mx-auto animate-in p-0">
        <h1 className="mb-6 text-2xl font-bold">
          Chat with {userType === "user" ? "Doctors" : "Patients"}
        </h1>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Available Users/Doctors List */}
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle>
                Available {userType === "user" ? "Doctors" : "Users"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {/* Show available conversations */}
                {conversations.length > 0 && (
                  <div className="mb-4">
                    <h3 className="p-2 text-sm font-medium text-muted-foreground">
                      Recent Conversations
                    </h3>
                    {conversations.map((conversation) => {
                      // Find the other participant
                      const otherParticipant = conversation.participants.find(
                        (p) => p.id !== currentId
                      );

                      // Find full user/doctor data from available users
                      const recipientData = availableUsers?.data?.find(
                        (u: UserProps | doctorProfileProps) =>
                          u._id === otherParticipant?.id
                      );

                      if (!recipientData) return null;

                      return (
                        <div
                          key={conversation._id}
                          className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-accent ${
                            selectedRecipient?._id === recipientData._id
                              ? "bg-accent"
                              : ""
                          }`}
                          onClick={() => setSelectedRecipient(recipientData)}
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={`https://i.pravatar.cc/150?img=${recipientData._id}`}
                              />
                              <AvatarFallback>
                                {recipientData.firstName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                                recipientData.isOnline
                                  ? "bg-green-500"
                                  : "bg-zinc-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {recipientData.firstName +
                                " " +
                                recipientData.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage?.text ||
                                "No messages yet"}
                            </p>
                          </div>
                          {/* {otherParticipant?.unreadCount > 0 && (
                            <Badge variant="destructive">
                              {otherParticipant.unreadCount}
                            </Badge>
                          )} */}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Show available users/doctors */}
                <h3 className="p-2 text-sm font-medium text-muted-foreground">
                  All {userType === "user" ? "Doctors" : "Users"}
                </h3>
                {availableUsers?.data?.map((recipient: doctorProfileProps) => (
                  <div
                    key={recipient._id}
                    className={`flex cursor-pointer items-center gap-3 border-b p-4 transition-colors hover:bg-accent ${
                      selectedRecipient?._id === recipient._id
                        ? "bg-accent"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedRecipient({
                        ...recipient,
                        _id: recipient._id,
                        isOnline: true,
                      })
                    }
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`https://i.pravatar.cc/150?img=${recipient._id}`}
                        />
                        <AvatarFallback>
                          {recipient.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                          recipient.isOnline ? "bg-green-500" : "bg-zinc-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {recipient.firstName + " " + recipient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userType === "user" && "specialization" in recipient
                          ? recipient.specialization
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant={recipient.isOnline ? "default" : "secondary"}
                    >
                      {recipient.isOnline ? "active" : "offline"}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="h-[calc(100vh-200px)]">
            {selectedRecipient ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`https://i.pravatar.cc/150?img=${selectedRecipient._id}`}
                        />
                        <AvatarFallback>
                          {selectedRecipient.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>
                          {getRecipientName(selectedRecipient)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {userType === "user" &&
                          "specialization" in selectedRecipient
                            ? selectedRecipient.specialization
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={startAudioCall}
                        disabled={isVideoCallOpen}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={startVideoCall}
                        disabled={isVideoCallOpen}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex h-[calc(100%-160px)] flex-col justify-between p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${
                            message.sender.id === currentId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 max-w-[80%] ${
                              message.sender.id === currentId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div
                              className={`flex gap-2 items-center ${
                                message.sender.id === currentId
                                  ? "flex-row-reverse"
                                  : ""
                              }`}
                            >
                              {message.sender.id === currentId ? (
                                <UserCheck size={15} />
                              ) : (
                                <User2 size={15} />
                              )}

                              <p className="break-words">{message.text}</p>
                            </div>
                            <p className="mt-1 text-xs opacity-70">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messageEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="border-t p-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" className="flex-shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <User2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>
                    Select a {userType === "user" ? "doctor" : "user"} to start
                    chatting
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Video Call Dialog */}
        <VideoCallDialog
          isOpen={isVideoCallOpen}
          callState={callState}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          onEndCall={endCall}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onAcceptCall={acceptCall}
          onRejectCall={rejectCall}
        />
      </div>
    </MainLayout>
  );
};

export default Chat;
