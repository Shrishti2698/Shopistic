
// to have global state for the user related things. Eg, user State if you're checking for the authentication, signingUp the user when logging in or logging out etc
// using Zustand

import { create } from "zustand";
import axios from "../lib/axios.js";
import { toast } from "react-hot-toast";  // notification shown to user

export const useUserStore = create((set, get) => ({
    // bydefault
	user: null,
	loading: false,
	checkingAuth: true,

   
	signup: async ({ name, email, password, confirmPassword }) => {  // if the user wants to signup then what they have to send us??
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			set({ user: res.data, loading: false });  // set the user w the response data coz the user data we'll get from the backend
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });

			set({ user: res.data, loading: false }) // res.data is correct coz res.data.user is undefined
		} catch (error) {
			console.log(error);
			
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	logout: async () => {
		try {  // user is gonna null when we call this function. And we send a req to the end point (i.e, logout)
			await axios.post("/auth/logout");
			set({ user: null });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false }) // it will return user profile. Once we got it, we gonna say checkingAuth: false
		} catch (error) {
			console.log("Profile auth error : ",error.message);
			set({ checkingAuth: false, user: null });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh  (as this token will refresh in every 15 mins and user can't login every 15 mins). 
// Hence, we use the concept called, "interceptor". it will kinda refresh the access token in every 15 min 
let refreshPromise = null; 
// We have to use Refresh Token to be able to get the Access Token

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);



// once we login (onClick "login"), we should be able to get a refresh token (expire in 7 days) on my dashboard 
// And when the user logout, the access token would be deleted
