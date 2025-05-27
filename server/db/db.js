import mongoose from "mongoose";

let isConnected = false;

async function connectToDb() {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    await mongoose.connect(process.env.MONGOOSE_URI, options);
    isConnected = true;
    console.log("Database connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      isConnected = false;
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!isConnected) {
          console.log("Attempting to reconnect to MongoDB...");
          connectToDb();
        }
      }, 5000);
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("Database connection error:", error.message);
    isConnected = false;
    // Retry connection after 5 seconds if not connected
    setTimeout(() => {
      if (!isConnected) {
        console.log("Retrying database connection...");
        connectToDb();
      }
    }, 5000);
  }
}

export default connectToDb;
