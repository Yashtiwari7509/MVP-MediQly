import express from "express";
import { validate } from "../middlewares/validateReq.js";
import { loginSchema } from "../schemas/user.schema.js";
import { signInUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/login", validate(loginSchema), signInUser);

export default router;
