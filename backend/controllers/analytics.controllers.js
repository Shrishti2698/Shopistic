
// NOT SO IMPORTANT (IT'S TOUGH) 

import Order from "../models/order.models.js";
import Product from "../models/product.models.js";
import User from "../models/user.models.js";

export const getAnalyticsData = async () => {
	const totalUsers = await User.countDocuments();
	const totalProducts = await Product.countDocuments();

	const salesData = await Order.aggregate([   // using aggeregate pipeline here, for the 4 cards..... "total users", "total products", "total sales", "total revenue"
		{
			$group: {   // grouping the data we're gonna get
				_id: null, // it groups all documents together,
				totalSales: { $sum: 1 },  // counting total num of orders and assigning it to the "totalSales"  (see 3rd card in analytics img)
				totalRevenue: { $sum: "$totalAmount" },  // totalAmount-> analytics.models.js 
			},
		},
	]);

	const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };  // incase it is undefined, we can back this up w the empty object w key

	return {
		users: totalUsers,
		products: totalProducts,
		totalSales,
		totalRevenue,
	};
};


// Now we need to get the data for the graph (analytics img)  --> monday to sunday
//   3:30:40
export const getDailySalesData = async (startDate, endDate) => {
	try {
		const dailySalesData = await Order.aggregate([ // aggeregating this orders
			{
				$match: {
					createdAt: {
						$gte: startDate,  // filtering w the match field, greater than the startdate
						$lte: endDate,  // filtering w the match field, lesser than the enddate
					},
				},
			},
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales: { $sum: 1 },
					revenue: { $sum: "$totalAmount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// example of dailySalesData
		// [
		// 	{
		// 		_id: "2024-08-18",
		// 		sales: 12,
		// 		revenue: 1450.75
		// 	},
		// ]

		const dateArray = getDatesInRange(startDate, endDate);
		// console.log(dateArray) // ['2024-08-18', '2024-08-19', ... ]

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);  // if item._id === date that means we found the data

            // else
			return {
				date,
				sales: foundData?.sales || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error;
	}
};

function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}