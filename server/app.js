import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import connectToDb from "./configs/dbConnect.js";

// ROUTES
import userRoute from "./routes/user.route.js";
import doctorRoute from "./routes/doctor.route.js";

dotenv.config();

connectToDb();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

//route handlers
app.use("/user", userRoute);
app.use("/doctor", doctorRoute);

//mock route for testing
app.get("/", (req, res) => {
  res.send({ message: "hello from yash" });
});

export default app;
