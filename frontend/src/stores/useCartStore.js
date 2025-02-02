import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},

	addToCart: async (product) => {  // if we click "add to cart" button twice or more, it should update the quantity at top of cart
		try {
			await axios.post("/cart", { productId: product._id });  // productId is coming from backend (cart.controller.js --> addToCart)
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>   // checking, wether we have "existingItem" already in our state or not, if it's there we're incrementing the quantity of the product in the cart
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					  )
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();  // call this function to update the state in UI
		} catch (error) {
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	removeFromCart: async (productId) => {
		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) })); // filtering out the deleted product
		get().calculateTotals();
	},

	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		await axios.put(`/cart/${productId}`, { quantity });
		set((prevState) => ({   // upadting the UI
			cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),  // 5:48:25
		}));
		get().calculateTotals();
	},

	calculateTotals: () => {  // we also have to increase the Amount(price) in the cart as per incremnent of the products
		const { cart, coupon } = get();  // we're getting the cart and the coupon (if we have it)
		// cart and coupon -> initialized empty at the top
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);  // starting from the 0, it will be added accordingly
		let total = subtotal;

		if (coupon) {  // discount will be applied according to the coupon (if applicable)
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ subtotal, total });  // updating
	},
}));