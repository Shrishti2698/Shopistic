import Coupon from "../models/coupon.models.js";

export const getCoupon = async (req, res) => {
	try {
		const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true }) // finding one coupon
		res.json(coupon || null) // in this case (above) we gonna fetch the coupon. If it is undefined:- return "null"
	} catch (error) {
		console.log("Error in getCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


// validating coupon: onClick of user "Apply Code" (i.e., coupon is expired or not, user is not cheating)
export const validateCoupon = async (req, res) => {
	try {
		const { code } = req.body;
		const coupon = await Coupon.findOne({ code: code, userId: req.user._id, isActive: true }) // code: code -> code is matching or not w the code, user is passing 

		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}

        // checking if coupon has already been expired or not
		if (coupon.expirationDate < new Date()) {  // Here, the coupon has been expired
			coupon.isActive = false;  // coupon is expired
			await coupon.save();
			return res.status(404).json({ message: "Coupon expired" });
		}

        // (else)
		res.json({
			message: "Coupon is valid",
			code: coupon.code,
			discountPercentage: coupon.discountPercentage,
		});
	} catch (error) {
		console.log("Error in validateCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};