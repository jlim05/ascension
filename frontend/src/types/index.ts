export interface Player {
  id: string;
  username: string;
  level: number;
  currentXP: number;
  rank: string;
  currentStreak: number;
  dayOffTokens: number;
  stats: {
    str: number;
    agi: number;
    vit: number;
    intel: number;
  };
  goal: {
    focus: string;
    daysPerWeek: number;
    equipment: string;
  };
  achievements: Achievement[];
}

export interface Quest {
  id: string;
  playerId: string;
  type: string;
  description: string;
  xpReward: number;
  statReward: number;
  status: "Pending" | "Completed" | "Failed";
  assignedDate: string;
  dueDate: string;
  isWeeklyGate: boolean;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  level: number;
  currentXP: number;
  rank: string;
  str: number;
  agi: number;
  vit: number;
}

// The four focuses the quest engine understands. Kept as a const array so the
// select options and the Focus union can never drift apart.
export const FOCUS_TYPES = ["Bulking", "Cutting", "Maintain", "MainGain"] as const;
export type Focus = (typeof FOCUS_TYPES)[number];

export interface Goal {
  id: string;
  focus: Focus;
  daysPerWeek: number;
  equipment: string;
}

export type GoalInput = Omit<Goal, "id">;

export interface Achievement {
  name: string;
  description: string;
  unlockedAt: string;
}