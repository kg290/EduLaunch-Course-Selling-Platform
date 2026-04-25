const axios = require("axios");
const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";

const isRazorpayConfigured = () => {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};

const createRazorpayOrderRequest = async (orderPayload) => {
  if (!isRazorpayConfigured()) {
    const configError = new Error("Razorpay credentials are not configured.");
    configError.statusCode = 503;
    throw configError;
  }

  try {
    const response = await axios.post(
      `${RAZORPAY_API_BASE_URL}/orders`,
      orderPayload,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET
        },
        timeout: 15000
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      const apiDescription =
        error.response.data?.error?.description ||
        "Razorpay request failed.";
      const apiError = new Error(apiDescription);
      apiError.statusCode = error.response.status;
      throw apiError;
    }

    if (error.request) {
      const networkError = new Error(
        "Unable to reach Razorpay API. Please check internet connectivity and firewall settings."
      );
      networkError.statusCode = 503;
      throw networkError;
    }

    throw error;
  }
};

module.exports = { isRazorpayConfigured, createRazorpayOrderRequest };
