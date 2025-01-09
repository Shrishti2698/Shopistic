import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts, getRecommendedProducts, getProductsByCategory, toggleFeaturedProduct } from "../controllers/product.controllers.js";

const router = express.Router();


router.get("/", protectRoute, adminRoute, getAllProducts)
// ONLY ADMINS SHOULD GET THE ACCESS OF ALL THE PRODUCTs (users can only see recommeended products)
// if user calls both these checks: protectRoute, adminRoute, then he'll be able to access this getAllProducts route
router.get("/featured", getFeaturedProducts)   // no middleware coz everyone should be able to call this function
router.post("/", protectRoute, adminRoute, createProduct)  // adminRoute:- only admin can create a product  // this will be executed/routed onClick of "create product" btn
// to be able to create a product we need Images... Cloudinary (1:42:30)

router.delete("/:id", protectRoute, adminRoute, deleteProduct)   // only admin can delete that

// user should always get recommendation of atleast 3 diff products that people bought this products
router.get("/reccommendations", getRecommendedProducts)


// now, Home -> user clicks on whichever product, it should only show that item
router.get("/category/:category", getProductsByCategory)

router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct)


export default router;