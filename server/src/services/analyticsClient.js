import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const analyticsClient = axios.create({
  baseURL: env.analyticsServiceUrl,
  timeout: env.analyticsTimeoutMs
});

const safePost = async (path, payload, fallback) => {
  try {
    const { data } = await analyticsClient.post(path, payload);
    return data;
  } catch (error) {
    logger.warn("Analytics request failed", { path, message: error.message });
    return fallback;
  }
};

export const fetchRecommendations = (payload) =>
  safePost("/recommend", payload, { recommendations: [] });

export const fetchForecast = (payload) => safePost("/forecast", payload, { forecast: [] });

export const fetchSegments = (payload) => safePost("/segment", payload, { segments: [] });
