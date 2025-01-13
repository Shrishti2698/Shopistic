import express from "express";
import { login, logout, signup, refreshToken, getProfile } from "../controllers/auth.controllers.js"

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", getProfile);  // this will check if the user is authenticated or not

export default router;