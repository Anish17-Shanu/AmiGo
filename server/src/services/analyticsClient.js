import axios from "axios";
import { env } from "../config/env.js";

const analyticsClient = axios.create({
  baseURL: env.analyticsServiceUrl,
  timeout: 7000
});

export const fetchRecommendations = async (payload) => {
  const { data } = await analyticsClient.post("/recommend", payload);
  return data;
};

export const fetchForecast = async (payload) => {
  const { data } = await analyticsClient.post("/forecast", payload);
  return data;
};

export const fetchSegments = async (payload) => {
  const { data } = await analyticsClient.post("/segment", payload);
  return data;
};
