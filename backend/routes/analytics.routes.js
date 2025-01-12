import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getAnalyticsData, getDailySalesData } from "../controllers/analytics.controllers.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, async (req, res) => {  // this is the "controller"         // only admins can see the analytics data
	try {
		const analyticsData = await getAnalyticsData();  // this is just a "function", so not taking (res,req) argument    // getAnalyticsData() will be using the 4 cards data... refer analytics Img

        // end date will be today and start date will be of 7 days back (last week)
		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);  // start day gonna be 7 days back (we want data for the ast week)

		const dailySalesData = await getDailySalesData(startDate, endDate);

		res.json({
			analyticsData,
			dailySalesData,
		});
	} catch (error) {
		console.log("Error in analytics route", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

export default router;