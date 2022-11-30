// Create an axios instance with retry logic on 429 errors.

import axios from "axios";

const axiosRetry = axios.create();

axiosRetry.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 429) {
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
