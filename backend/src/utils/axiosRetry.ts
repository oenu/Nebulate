import { getJWT } from "./../auth/jwt";
import axios from "axios";

const axiosRetry = axios.create();

axiosRetry.interceptors.request.use(async (config) => {
  if (global.token === undefined) {
    try {
      await getJWT();
    } catch (error) {
      throw new Error("axiosRetry: getJWT failed");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  config.headers!.Authorization = `Bearer ${global.token}`;
  return config;
});

axiosRetry.interceptors.response.use(undefined, (error) => {
  // Handle authentication errors
  if (error.response.status === 401) {
    // Update the JWT and retry the request (need to replace the token in the request)

    // Make a new promise to handle the retry
    return new Promise((resolve) => {
      getJWT().then((token) => {
        // Replace the token in the request
        error.config.headers.Authorization = `Bearer ${token}`;
        // Retry the request
        resolve(axiosRetry(error.config));
      });
    });
  }

  if (error.response.status === 429) {
    return new Promise((resolve) => {
      const retryAfter = Number(error.response.headers["retry-after"]) + 2;
      console.info("429 error, retrying in [ ", retryAfter, " ] seconds");
      setTimeout(() => {
        resolve(axiosRetry.request(error.config));
      }, retryAfter * 1000);
    });
  }

  return Promise.reject(error);
});

export default axiosRetry;
