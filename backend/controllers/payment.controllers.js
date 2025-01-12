import Coupon from "../models/coupon.models.js";
import Order from "../models/order.models.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body // user will send this { products, couponCode } (refer paymentFlow Img)

		if (!Array.isArray(products) || products.length === 0) {  // chcecking whether products are in the form of array
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

        // Now we need to calculate the total amount
		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
			totalAmount += amount * product.quantity;  // for each one of them, we wanna calculate Total amount

			return {  // for each product, returning an object
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,  // name in the paymentFlow img (left side), showing name of the product(s)
						images: [product.image],  // img in the paymentFlow img (left side), showing img of the product(s)
					},
					unit_amount: amount,
				},
				quantity: product.quantity || 1,
			};
		});

		let coupon = null;
		if (couponCode) {   // user sent this 
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {  // checking if coupon is in DB or not
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);  // (/ 100) coz we're converting it in cents
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"], // or we can also, ["card", "paypal", etc]
			line_items: lineItems,
			mode: "payment",
			// onClick of   "Pay"  button (on payment)
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,  // if everything goes correctly we're gonna take the user to the success page
			// when we'll deploy our application, this url is gonna change.
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,  // if user clicks on the back arrrow on top left  // it'll say something like- "why u went back, pls came back later"
			discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
			metadata: {  // this are the fields we're gonna extract from the session
				userId: req.user._id.toString(), // converting it to string coz it is object id bydefault coz it is coming from mongoDB
				couponCode: couponCode || "",
				products: JSON.stringify(    // for each product, we added id, quantity and price and stringify them
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
			},
		});

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);  // CREATING IT AGAIN FOR THE USER FOR NEXT PURCHASE
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });  // will be sending this session.id through frontend
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};


// Getting the session id from the user. 
// Checking if it is paid. Then delete it. 
// Creating a new order, saving it in DB. 
// Sending the json res to the user.
export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;  // getting the session id from user
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status === "paid") {  // we checked, we paid successfully. Then we deleted (updated) the coupon
			if (session.metadata.couponCode) {
				await Coupon.findOneAndUpdate(
					{
						code: session.metadata.couponCode,
						userId: session.metadata.userId,
					},
					{
						isActive: false,
					}
				);
			}

			// create a new Order (as payment is done)
			const products = JSON.parse(session.metadata.products);  // getting the response from metadata
			const newOrder = new Order({
				user: session.metadata.userId,
				products: products.map((product) => ({   // refer order.models.js
					product: product.id,
					quantity: product.quantity,
					price: product.price,
				})),
				totalAmount: session.amount_total / 100, // convert from cents to dollars,
				stripeSessionId: sessionId,
			});

			await newOrder.save();

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
			});
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),  // GIFT + any random value
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}


// test it in POSTMAN  (2:55:20)