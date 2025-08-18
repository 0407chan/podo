import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  hideDoneLinkedTodos: boolean;
  hideDoneDailyTodos: boolean;
  setHideDoneLinkedTodos: (value: boolean) => void;
  toggleHideDoneLinkedTodos: () => void;
  setHideDoneDailyTodos: (value: boolean) => void;
  toggleHideDoneDailyTodos: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hideDoneLinkedTodos: false,
      hideDoneDailyTodos: false,
      setHideDoneLinkedTodos: (value: boolean) =>
        set({ hideDoneLinkedTodos: value }),
      toggleHideDoneLinkedTodos: () =>
        set({ hideDoneLinkedTodos: !get().hideDoneLinkedTodos }),
      setHideDoneDailyTodos: (value: boolean) =>
        set({ hideDoneDailyTodos: value }),
      toggleHideDoneDailyTodos: () =>
        set({ hideDoneDailyTodos: !get().hideDoneDailyTodos }),
    }),
    {
      name: "podo:settings:v1",
      version: 1,
    }
  )
);
