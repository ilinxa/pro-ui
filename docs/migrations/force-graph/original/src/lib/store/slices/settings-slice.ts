import type { StateCreator } from "zustand";
import type { GraphSettings } from "../../../types";
import { DEFAULT_GRAPH_SETTINGS } from "../../../types";

export interface SettingsSlice {
  settings: GraphSettings;
  setSettings(patch: Partial<GraphSettings>): void;
  setLayoutEnabled(enabled: boolean): void;
}

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set) => ({
  settings: DEFAULT_GRAPH_SETTINGS,
  setSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),
  setLayoutEnabled: (enabled) =>
    set((state) => ({
      settings: { ...state.settings, layoutEnabled: enabled },
    })),
});
