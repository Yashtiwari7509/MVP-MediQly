import express from "express";
import validateBody from "../middlewares/validateBody.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../validations/user.schema.js";
import {
  getUserProfile,
  registerUser,
  signInUser,
} from "../controllers/user.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", validateBody(loginUserSchema), signInUser);
router.post("/register", validateBody(registerUserSchema), registerUser);
router.get("/profile", authUser, getUserProfile);

export default router;
