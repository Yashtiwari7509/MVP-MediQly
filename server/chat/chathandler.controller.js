// chathandler.controller.js - Enhanced version for better video calling
import { Server } from "socket.io";
import mongoose from "mongoose";
import { Conversation } from "../models/chat.model.js";
import dotenv from "dotenv";

dotenv.config();

const onlineUsers = new Map();
const activeCalls = new Map();

export function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:8080",
        process.env.CLIEND_URL || "https://mvp-mediqly.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle initial connection with query params
    const { userId, userType } = socket.handshake.query;
    if (userId && userType) {
      console.log(`User ${userId} (${userType}) connected via query params`);
      onlineUsers.set(userId, {
        socketId: socket.id,
        userType,
        isOnline: true,
      });
      io.emit("user-status-change", { userId, isOnline: true });
    }

    // Handle user connect event (primary method)
    socket.on("user-connect", (userData) => {
      const { userId, userType } = userData;
      console.log(`User connect event received: ${userId} (${userType})`);

      if (userId) {
        onlineUsers.set(userId, {
          socketId: socket.id,
          userType,
          isOnline: true,
        });
        console.log(`User ${userId} added to online users`);
        io.emit("user-status-change", { userId, isOnline: true });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      for (const [key, value] of onlineUsers.entries()) {
        if (value.socketId === socket.id) {
          console.log(`Removing user ${key} from online users`);

          // Handle active call cleanup
          const activeCall = activeCalls.get(key);
          if (activeCall) {
            const partnerId = activeCall.partnerId;
            const partner = onlineUsers.get(partnerId);
            if (partner) {
              io.to(partner.socketId).emit("call-ended", {
                from: key,
                to: partnerId,
              });
            }
            activeCalls.delete(key);
            activeCalls.delete(partnerId);
            console.log(`Cleaned up active call for ${key}`);
          }

          onlineUsers.delete(key);
          io.emit("user-status-change", { userId: key, isOnline: false });
          break;
        }
      }
    });

    // Chat message handling
    socket.on(
      "send-message",
      async ({ senderId, receiverId, text, senderType }) => {
        if (!senderId || !receiverId || !text) return;

        try {
          const conversation = await Conversation.findOrCreateConversation(
            senderType === "user" ? senderId : receiverId,
            senderType === "user" ? receiverId : senderId
          );

          await conversation.addMessage({
            senderId,
            receiverId,
            text,
            senderType,
          });

          const updatedConversation = await Conversation.findById(
            conversation._id
          );
          const newMessage = updatedConversation.messages.at(-1);

          socket.emit("new-message", {
            conversationId: conversation._id,
            message: newMessage,
          });

          const receiver = onlineUsers.get(receiverId);
          if (receiver) {
            io.to(receiver.socketId).emit("new-message", {
              conversationId: conversation._id,
              message: newMessage,
            });
            io.to(receiver.socketId).emit("message-notification", {
              conversationId: conversation._id,
              message: newMessage,
            });
          }
        } catch (error) {
          console.error("Message send error:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("get-chat-history", async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        socket.emit("chat-history", {
          conversationId,
          messages: conversation ? conversation.messages : [],
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to fetch chat history" });
      }
    });

    socket.on("mark-messages-read", async ({ conversationId, userId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.markAsRead(userId);
          const other = conversation.participants.find(
            (p) => p.id.toString() !== userId.toString()
          );
          const otherSocket = onlineUsers.get(other?.id.toString());
          if (otherSocket) {
            io.to(otherSocket.socketId).emit("messages-read", {
              conversationId,
              userId,
            });
          }
          socket.emit("messages-marked-read", { conversationId });
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to mark messages read" });
      }
    });

    socket.on("get-conversations", async ({ userId }) => {
      try {
        const conversations = await Conversation.find({
          "participants.id": new mongoose.Types.ObjectId(userId),
        }).sort({ "lastMessage.timestamp": -1 });
        socket.emit("user-conversations", { conversations });
      } catch (err) {
        socket.emit("error", { message: "Failed to fetch conversations" });
      }
    });

    // ========================= Enhanced WebRTC Signaling ========================= //

    socket.on("initiate-call", (data) => {
      const { from, fromType, to, toType } = data;
      console.log(
        `Call initiation: ${from} (${fromType}) -> ${to} (${toType})`
      );

      if (!from || !to) {
        console.error("Missing from or to in initiate-call");
        return;
      }

      const target = onlineUsers.get(to);
      console.log("Target user info:", target);

      if (!target) {
        console.log(`Target user ${to} is offline`);
        return socket.emit("user-offline", { userId: to });
      }

      // Check if either user is already in a call
      if (activeCalls.has(from) || activeCalls.has(to)) {
        console.log(`User busy: ${from} or ${to} already in call`);
        return socket.emit("user-busy", { from, to });
      }

      // Set up active call tracking
      activeCalls.set(from, { partnerId: to, socketId: socket.id });
      activeCalls.set(to, { partnerId: from, socketId: target.socketId });

      console.log(
        `Sending incoming call to ${to} at socket ${target.socketId}`
      );

      // Send incoming call notification immediately
      io.to(target.socketId).emit("incoming-call", {
        from,
        fromType,
        fromName: fromType === "doctor" ? "Doctor" : "Patient",
      });

      // Acknowledge call initiation to caller
      socket.emit("call-initiated", { to, toType });

      // Set timeout for call response (30 seconds)
      setTimeout(() => {
        if (activeCalls.get(from)?.partnerId === to) {
          console.log(`Call timeout between ${from} and ${to}`);
          activeCalls.delete(from);
          activeCalls.delete(to);
          io.to(socket.id).emit("call-timeout", { to });
          io.to(target.socketId).emit("call-timeout", { from });
        }
      }, 30000);
    });

    socket.on("call-offer", ({ from, to, offer }) => {
      console.log(`Call offer: ${from} -> ${to}`);
      const target = onlineUsers.get(to);
      if (target) {
        console.log("Forwarding offer to target");
        io.to(target.socketId).emit("call-offer", { from, to, offer });
      } else {
        console.error(`Target ${to} not found for call offer`);
        socket.emit("user-offline", { userId: to });
      }
    });

    socket.on("call-answer", ({ from, to, answer }) => {
      console.log(`Call answer: ${from} -> ${to}`);
      const target = onlineUsers.get(to);
      if (target) {
        console.log("Forwarding answer to target");
        io.to(target.socketId).emit("call-answer", { from, to, answer });
      } else {
        console.error(`Target ${to} not found for call answer`);
        socket.emit("user-offline", { userId: to });
      }
    });

    socket.on("ice-candidate", ({ from, to, candidate }) => {
      console.log(`ICE candidate: ${from} -> ${to}`);
      const target = onlineUsers.get(to);
      if (target) {
        io.to(target.socketId).emit("ice-candidate", { from, to, candidate });
      } else {
        console.error(`Target ${to} not found for ICE candidate`);
      }
    });

    socket.on("call-accepted", ({ from, to }) => {
      console.log(`Call accepted: ${from} -> ${to}`);
      const target = onlineUsers.get(to);
      if (target) {
        io.to(target.socketId).emit("call-accepted", { from, to });
      }
    });

    socket.on("call-rejected", ({ from, to, reason }) => {
      console.log(`Call rejected: ${from} -> ${to}, reason: ${reason}`);
      const target = onlineUsers.get(to);

      // Clean up call tracking
      activeCalls.delete(from);
      activeCalls.delete(to);

      if (target) {
        io.to(target.socketId).emit("call-rejected", { from, to, reason });
      }
    });

    socket.on("call-ended", ({ from, to }) => {
      console.log(`Call ended: ${from} -> ${to}`);
      const target = onlineUsers.get(to);

      // Clean up call tracking
      activeCalls.delete(from);
      activeCalls.delete(to);

      if (target) {
        io.to(target.socketId).emit("call-ended", { from, to });
      }
    });

    // Debug endpoint to check online users
    socket.on("get-online-users", () => {
      const users = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        id,
        socketId: data.socketId,
        userType: data.userType,
        isOnline: data.isOnline,
      }));
      socket.emit("online-users-list", users);
      console.log("Current online users:", users);
    });

    // Debug endpoint to check active calls
    socket.on("get-active-calls", () => {
      const calls = Array.from(activeCalls.entries()).map(([id, data]) => ({
        userId: id,
        partnerId: data.partnerId,
        socketId: data.socketId,
      }));
      socket.emit("active-calls-list", calls);
      console.log("Current active calls:", calls);
    });
  });

  return io;
}
