import * as signalR from "@microsoft/signalr";
import { create } from "zustand";
import { NOTIFICATION_HUB_URL } from "../config";

export interface Notification {
  id: string;
  message: string;
  type: "quest" | "levelup" | "gate" | "penalty";
  xpReward?: number;
  statReward?: number;
  statType?: string;
  newLevel?: number;
  newRank?: string;
}

interface NotificationState {
  notifications: Notification[];
  connection: signalR.HubConnection | null;
  addNotification: (n: Notification) => void;
  removeNotification: (id: string) => void;
  startConnection: (token: string) => Promise<void>;
  stopConnection: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  connection: null,

  addNotification: (n) =>
    set((state) => ({ notifications: [...state.notifications, n] })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  startConnection: async (token: string) => {
    // Don't start if already connected
    const existing = get().connection;
    if (existing) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(NOTIFICATION_HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    // Listen for quest completion notifications from the server
    connection.on("QuestCompleted", (data) => {
      const isLevelUp = data.newLevel > 1;
      const isGate = data.isWeeklyGate;

      get().addNotification({
        id: crypto.randomUUID(),
        message: isGate
          ? `⚔️ Weekly Gate cleared! +${data.xpReward} XP · Day-Off Token earned`
          : isLevelUp
          ? `⚡ LEVEL UP! You are now Level ${data.newLevel} · Rank ${data.newRank}`
          : `✓ Quest complete · +${data.xpReward} XP · +${data.statReward} ${data.statType}`,
        type: isLevelUp ? "levelup" : isGate ? "gate" : "quest",
        xpReward: data.xpReward,
        statReward: data.statReward,
        statType: data.statType,
        newLevel: data.newLevel,
        newRank: data.newRank,
      });

      // Auto-remove after 5 seconds
      setTimeout(() => {
        get().removeNotification(get().notifications[0]?.id);
      }, 5000);
    });

    try {
      await connection.start();
      set({ connection });
    } catch (err) {
      console.error("SignalR connection failed:", err);
    }
  },

  stopConnection: async () => {
    const connection = get().connection;
    if (connection) {
      await connection.stop();
      set({ connection: null });
    }
  },
}));