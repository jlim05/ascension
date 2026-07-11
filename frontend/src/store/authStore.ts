import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Player } from "../types";

interface AuthState {
  token: string | null;
  player: Player | null;
  setAuth: (token: string, player: Player) => void;
  updatePlayer: (player: Player) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      player: null,

      setAuth: (token, player) => set({ token, player }),

      updatePlayer: (player) => set({ player }),

      logout: () => set({ token: null, player: null }),
    }),
    {
      name: "ascension-auth", // key in localStorage
    }
  )
);