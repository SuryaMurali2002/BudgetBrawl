import { apiClient } from "./client";

export const getBalance = () =>
  apiClient.get("/wallet/balance").then((r) => r.data);
export const getTransactions = () =>
  apiClient.get("/wallet/transactions").then((r) => r.data);

/** Balance over time for chart (created_at, balance_after). */
export const getBalanceHistory = () =>
  apiClient.get("/wallet/balance-history").then((r) => r.data);
