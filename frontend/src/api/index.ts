import client from "./client";
import type { Player, Quest, LeaderboardEntry, Goal, GoalInput } from "../types";

// Auth
export const register = (data: {
  username: string;
  email: string;
  password: string;
  focus: string;
  daysPerWeek: number;
  equipment: string;
}) => client.post("/auth/register", data);

export const login = (data: {
  username: string;
  password: string;
}) =>
  client.post<{ token: string; playerId: string; username: string; level: number; rank: string }>(
    "/auth/login",
    data
  );

// Player
export const getMyProfile = () =>
  client.get<Player>("/players/me");

export const getLeaderboard = () =>
  client.get<LeaderboardEntry[]>("/players/leaderboard");

// Quests
export const getTodaysQuest = () =>
  client.get<Quest>("/quests/today");

export const getWeeklyGate = () =>
  client.get<Quest>("/quests/weekly-gate");

export const completeQuest = (id: string) =>
  client.post(`/quests/${id}/complete`);

// Goals — full CRUD. The player is identified by their JWT, so no id in the URL.
export const getGoal = () =>
  client.get<Goal>("/goals");

export const createGoal = (data: GoalInput) =>
  client.post<Goal>("/goals", data);

export const updateGoal = (data: GoalInput) =>
  client.put<Goal>("/goals", data);

export const deleteGoal = () =>
  client.delete("/goals");