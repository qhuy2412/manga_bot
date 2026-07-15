import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./database";
import { config } from "./config/config";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.listen(config.PORT, async () => {
    await connectDB(config.MONGODB_URI);
    console.log(`Server is running on port ${config.PORT}`);
});
