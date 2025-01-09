import express from "express"
import { addToCart, getCartProducts, removeAllFromCart, updateQuantity } from "../controllers/cart.controllers.js"
import { protectRoute } from "../middleware/auth.middleware.js"

const router = express.Router()

router.get("/", protectRoute, getCartProducts) 
router.post("/", protectRoute, addToCart)   // no adminRoute coz a regular customer should also be able to add a product
router.delete("/", protectRoute, removeAllFromCart) //onClick delete, it is going to delete the product from the cart completely irrespective of the quantity
router.put("/:id", protectRoute, updateQuantity)  // [+/-]

export default router
