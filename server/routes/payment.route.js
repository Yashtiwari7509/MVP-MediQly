
import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getUserPayments,
  getDoctorPayments
} from "../controllers/payment.controller.js";
import { authUser, authDoctor } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User payment routes
router.post("/create-intent", authUser, createPaymentIntent);
router.post("/confirm", authUser, confirmPayment);

// User payment routes
router.get("/user-history", authUser, getUserPayments);

// Doctor payment routes
router.get("/doctor-history", authDoctor, getDoctorPayments);

export default router;
