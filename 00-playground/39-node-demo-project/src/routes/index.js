import express from "express";
import { getIndex } from "../controllers/index.js";

const router = express.Router();

// Define routes
router.get("/", getIndex);

export default router;
