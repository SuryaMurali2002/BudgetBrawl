import { apiClient } from "./client";

export const getPredictions = () =>
  apiClient.get("/predictions/").then((r) => r.data);
export const generatePredictions = () =>
  apiClient.post("/predictions/generate").then((r) => r.data);

/** Resolved challenges: predicted vs actual spend over time (for charts). */
export const getPredictionVsActual = () =>
  apiClient.get("/predictions/vs-actual").then((r) => r.data);
