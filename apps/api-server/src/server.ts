import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./database"

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.listen(process.env.PORT || 3000, async () => {
    await connectDB(process.env.MONGODB_URI || "");
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
