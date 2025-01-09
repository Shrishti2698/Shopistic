import Product from "../models/product.models.js";

// we didn't have "quantity" in product.models.js. Instead, we're adding these lines under try
export const getCartProducts = async (req, res) => {
	try {
		const products = await Product.find({ _id: { $in: req.user.cartItems } }) // find the products where the id field is { $in: req.user.cartItems }

		// add quantity for each product
		const cartItems = products.map((product) => {
			const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id) 
			return { ...product.toJSON(), quantity: item.quantity } // returning all the products and and adding quantity on top of it
		});

		res.json(cartItems)
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};



export const addToCart = async (req, res) => {
    try {
		const { productId } = req.body  // user will send the productId
		const user = req.user;

		const existingItem = user.cartItems.find((item) => item.id === productId) // comparing the item selected by user and the selected one (if already selected then just increment the count)
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push(productId);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const removeAllFromCart = async (req, res) => {
    try {
		const { productId } = req.body  // getting the product Id that we want to delete
		const user = req.user;
		if (!productId) {
			user.cartItems = [] // if productId doesn't exist, return the cart item as it is
		} else {
			user.cartItems = user.cartItems.filter((item) => item.id !== productId)  // if exists, filter out the product from the cart item
		}
		await user.save()  // save user to the DB
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
}

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item) => item.id === productId);  // checking , the item exists or not

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => item.id !== productId);
				await user.save() // then save the user to the DB
				return res.json(user.cartItems);
			}

            // else (incrementing the quantity/value)
			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};