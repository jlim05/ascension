import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/authStore";
import type { Player } from "../types";

const mockPlayer: Player = {
  id: "test-id",
  username: "TestHunter",
  level: 1,
  currentXP: 0,
  rank: "E",
  currentStreak: 0,
  dayOffTokens: 0,
  stats: { str: 5, agi: 5, vit: 5, intel: 5 },
  goal: { focus: "Bulking", daysPerWeek: 4, equipment: "Full Gym" },
  achievements: [],
};

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, player: null });
  });

  it("starts with no token and no player", () => {
    const { token, player } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(player).toBeNull();
  });

  it("setAuth stores token and player", () => {
    useAuthStore.getState().setAuth("test-token", mockPlayer);
    const { token, player } = useAuthStore.getState();
    expect(token).toBe("test-token");
    expect(player?.username).toBe("TestHunter");
  });

  it("logout clears token and player", () => {
    useAuthStore.getState().setAuth("test-token", mockPlayer);
    useAuthStore.getState().logout();
    const { token, player } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(player).toBeNull();
  });

  it("updatePlayer updates player data", () => {
    useAuthStore.getState().setAuth("test-token", mockPlayer);
    const updatedPlayer = { ...mockPlayer, level: 2, currentXP: 140 };
    useAuthStore.getState().updatePlayer(updatedPlayer);
    expect(useAuthStore.getState().player?.level).toBe(2);
    expect(useAuthStore.getState().player?.currentXP).toBe(140);
  });
});