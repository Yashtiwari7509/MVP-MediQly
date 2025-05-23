import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

// Define Doctor Schema
const DoctorSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    profileImage: { type: String },

    // Professional Details
    specialization: {
      type: String,
      required: [true, "Specialization is required during registration"],
      enum: [
        "General Physician",
        "Cardiologist",
        "Dermatologist",
        "Pediatrician",
        "Orthopedic",
        "Neurologist",
        "Psychiatrist",
        "Gynecologist",
        "ENT Specialist",
        "Ophthalmologist",
        "Dentist",
        "Urologist",
        "Endocrinologist",
        "Pulmonologist",
        "Oncologist",
      ],
    },
    qualifications: {
      type: [String],
      required: true,
    },

    experience: {
      type: Number,
      required: [true, "Experience is required during registration"],
    },

    // System Fields
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Update timestamps before saving
DoctorSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Generate Auth Token for Doctor
DoctorSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id, role: "doctor" }, process.env.SECRET_TOKEN, {
    expiresIn: "24h",
  });
};

// Compare Password for Login
DoctorSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) {
    throw new Error("Password comparison failed: Missing password");
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

DoctorSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

export default mongoose.model("Doctor", DoctorSchema);

// // Hash Password before saving
// DoctorSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     return next();
//   }
//   try {
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// DoctorSchema.index({ location: "2dsphere" });
