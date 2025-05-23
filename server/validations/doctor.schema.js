import { z } from "zod";

export const registerDoctorSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
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
    .min(10)
    .max(15, "Must be a valid mobile phone number"), // you can use regex if needed
  specialization: z.string().min(1, "Specialization is required"),
  experience: z
    .number()
    .int()
    .nonnegative("Experience must be at least 1 year"),
  qualifications: z
    .array(z.string())
    .min(1, "At least one qualification is required"),
});

export const loginDoctorSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});
