import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const protectRoute = async (req, res, next)  => {   // protectRoute from product.route.js
    try{
      // check if the user is authenticated by taking a look at the access token (which we'll get from cookies)
      // in short, we're checking for the token from the cookies, if exists then we try to decode it, find the user from "userId" (that key token had) and putting that into req.user so that we can use this in diff functions
      const accessToken = req.cookies.accessToken;

      if(!accessToken) {
        return res.status(401).json({ message: "Unauthorized - No access token provided" })
      }

         try{
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(decoded.userId).select("-password");

			if (!user) {
				return res.status(401).json({ message: "User not found" });
			}

			req.user = user;

			next();   // i.e., adminRoute
         } catch (error) {
            if(error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized - access token expired" })
            }
            throw error // so that we can catch it below
         }

    } catch (error) {
      console.log("Error in protectRoute middleware", error.message);
      return res.status(401).json({message: "Unauthorized - Invalid access token" });
    }
}



export const adminRoute = (req, res, next) => {  // refer product.route.js 
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - Admin only" });
	}
}; 
