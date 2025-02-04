// ADMIN PRODUCT LIST... ALL THE PRODUCTS WILL BE SHOWN TO THE ADMIN. 
// Basically fetching the products from mongoDB and showing them in this page

// three main fuctionalities here,
// 1. fetching the products from mongoDB
// 2. featuring/ unfeaturing (check/ uncheck) the star
// 3. to be able to delete


import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
	products: [],
	loading: false,

	setProducts: (products) => set({ products }),
	createProduct: async (productData) => {
		set({ loading: true });
		try {
            // refer product.controllers.js "products"
			const res = await axios.post("/products", productData);  // post to our end point, which is "/products". And we'll send the productData which is coming from the admin 
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));
		} catch (error) {
			toast.error(error.response.data.error);
			set({ loading: false });
		}
	},

	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products");
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");  // it will show the custom msg if error.response.data.error is not shown
		}
	},

	fetchProductsByCategory: async (category) => {  // the function; which is going to fetch the products for that particular category
		set({ loading: true });
		try {
			const response = await axios.get(`/products/category/${category}`);
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");
		    console.log("this is the error");
		}
	},

	deleteProduct: async (productId) => {  // delete the product and check it in mongoose Atlas
		set({ loading: true });
        // we deleted our product and filtered out the state
		try {
			await axios.delete(`/products/${productId}`);  
			set((prevProducts) => ({
				products: prevProducts.products.filter((product) => product._id !== productId), // finding/filtering the product that we just deleted and remove it from the state
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to delete product");
		}
	},

	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
			// this will update the isFeatured prop of the product
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to update product");
		}
	},   // check in mongoose Atlas

	fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/featured");
			set({ products: response.data, loading: false });  // updating the product w the response
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			console.log("Error fetching featured products:", error);
		}
	},
}));