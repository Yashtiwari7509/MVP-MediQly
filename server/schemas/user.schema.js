import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(4, "Password must be at least 4 characters long"),
  firstName: z
    .string()
    .min(3)
    .max(20, "First name must be between 3 to 20 characters"),
  lastName: z
    .string()
    .min(3)
    .max(20, "Last name must be between 3 to 20 characters"),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Must be a valid mobile phone number"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Must be a valid date in YYYY-MM-DD format",
  }),
  gender: z.enum(["Male", "Female", "Other"]),
});

export const loginSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(2, "Password is required"),
});
