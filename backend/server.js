// in package.json:-
// "dev": "nodemon backend/server.js",  // used for development
// "start": "node backend/server.js"   // used in production

// const express = require("express");
import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
console.log(process.env.PORT);

app.use(express.json({ limit: "10mb" })) // allows you to parse the body of the request
app.use(cookieParser())

app.use("/api/auth", authRoutes)   // after "/api/auth", go to authRoutes function
app.use("/api/product", productRoutes)
app.use("/api/cart", cartRoutes)  // we're able to [+/-] or delete the product from Cart
app.use("/api/coupons", couponRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/analytics", analyticsRoutes)


app.listen(PORT, () => {
    console.log("server is running on port http://localhost:" + PORT);
    connectDB();
});


// cdq2fk1B7iNeuFqB - password from mongodb.com