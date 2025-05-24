import dotenv from "dotenv";
dotenv.config();
import paymentModel from "../models/payment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Create a payment intent
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, type, doctorId, notes } = req.body;

  try {
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
      currency: "inr",
      description: `Consultation payment for Dr. ${notes || doctorId}`,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user._id.toString(),
        doctorId: doctorId.toString(),
        type: type,
      },
    });

    // Create payment record in database (status: pending)
    const payment = await paymentModel.create({
      userId: req.user._id,
      doctorId,
      type,
      amount,
      currency: "INR",
      transactionId: paymentIntent.id,
      status: "pending",
      notes,
      endDate: type !== "one-time" ? calculateEndDate(type) : undefined,
    });

    // Return client secret to frontend
    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Payment intent creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
});

// Confirm payment success (webhook or client side confirmation)
export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentId, transactionId } = req.body;

  try {
    // Update payment status in database
    const updatedPayment = await paymentModel.findByIdAndUpdate(
      paymentId,
      {
        status: "completed",
        transactionId,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    return res.status(200).json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Payment confirmation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
});

// Get user's payment history
export const getUserPayments = asyncHandler(async (req, res) => {
  try {
    const payments = await paymentModel
      .find({ userId: req.user._id })
      .populate("doctorId", "firstName lastName specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Fetching payment history failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
});

// Get doctor's received payments
export const getDoctorPayments = asyncHandler(async (req, res) => {
  try {
    const payments = await paymentModel
      .find({ doctorId: req.doctor._id })
      .populate("userId", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Fetching doctor payments failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment records",
      error: error.message,
    });
  }
});

// Helper function to calculate subscription end date
function calculateEndDate(type) {
  const now = new Date();
  if (type === "monthly") {
    return new Date(now.setMonth(now.getMonth() + 1));
  } else if (type === "yearly") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  return now;
}
