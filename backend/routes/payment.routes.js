import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { checkoutSuccess, createCheckoutSession } from "../controllers/payment.controllers.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession) // refer- paymentFlow Img... user will have img, name and price of the products (he wants to purchase)... and it lets users to pay 
// for that we installed a package "Stripe"
router.post("/checkout-success", protectRoute, checkoutSuccess);  // when the user wants to check if the checkout was successfully done or not

export default router;