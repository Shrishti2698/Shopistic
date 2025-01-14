import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",
	withCredentials: true, // send cookies to the server (on every single req, the cookies will be sent)
    // we have to send cookies coz this is how we check authentication (refer auth.middleware... req.cookies.accessToken:- from the request we need to send the cookies which is the accessToken)
});

export default axiosInstance;