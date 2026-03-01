import { apiClient } from "./client";

export const getChallenges = () =>
  apiClient.get("/challenges/").then((r) => r.data);
export const getChallenge = (id: number) =>
  apiClient.get(`/challenges/${id}`).then((r) => r.data);
export const createChallenge = (data: {
  friend_id: string;
  prediction_id: number;
  event_id: string;
  spend_limit: number;
  stake_per_side?: number;
}) => apiClient.post("/challenges/", data).then((r) => r.data);
export const acceptChallenge = (id: number) =>
  apiClient.post(`/challenges/${id}/accept`).then((r) => r.data);
export const declineChallenge = (id: number) =>
  apiClient.post(`/challenges/${id}/decline`).then((r) => r.data);
export const reportSpend = (id: number, actual_amount_spent: number) =>
  apiClient
    .post(`/challenges/${id}/report`, { actual_amount_spent })
    .then((r) => r.data);

/** Win/loss stats: wins, losses, total_won, total_lost, win_rate. */
export const getWinLossStats = () =>
  apiClient.get("/challenges/stats").then((r) => r.data);
