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

export interface Achievement {
  name: string;
  description: string;
  unlockedAt: string;
}