import express from "express";
import {
  registerDoctor,
  signInDoctor,
  getDoctorProfile,
} from "../controllers/doctor.controller.js";
import validateBody from "../middlewares/validateBody.js";

import {
  registerDoctorSchema,
  loginDoctorSchema,
} from "../validations/doctor.schema.js";
import { authDoctor } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", validateBody(registerDoctorSchema), registerDoctor);

router.post("/login", validateBody(loginDoctorSchema), signInDoctor);

router.get("/profile", authDoctor, getDoctorProfile);


export default router;
