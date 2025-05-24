
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Doctor", 
      required: true 
    },

    // Payment Type: One-time Consultation or Subscription
    type: { 
      type: String, 
      enum: ["one-time", "monthly", "yearly"], 
      required: true 
    },

    // Amount Paid
    amount: { 
      type: Number, 
      required: true 
    },

    // Payment status
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed", "refunded"], 
      default: "pending" 
    },

    // External Payment Info (Stripe, Razorpay, etc.)
    transactionId: String,
    paymentMethod: String, // card, UPI, wallet, etc.
    currency: { type: String, default: "INR" },

    // Validity Period (for subscription types)
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }, // null for one-time

    // Notes or metadata
    notes: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Payment", PaymentSchema);
