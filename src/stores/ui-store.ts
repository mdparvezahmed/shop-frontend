"use client";

import { create } from "zustand";

/** Open/closed state of the storefront's overlays (cart drawer, mobile menu, search). */
type Panel = "cart" | "menu" | "search" | null;

type UiState = {
  panel: Panel;
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
};

export const useUi = create<UiState>()((set) => ({
  panel: null,
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
}));
