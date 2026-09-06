import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { dateKey, startOfPersianWeek } from "./jalali";
import { loadData, normalizeData, saveData } from "./planner-storage";
import {
  createId,
  defaultData,
  emptyWeek,
  type Activity,
  type PlannerData,
  type Slot,
  type Tile,
  type WeekPlan,
} from "./planner-types";

type NewActivity = Omit<Activity, "id" | "done"> & { done?: boolean };

type PlannerContextValue = {
  ready: boolean;
  data: PlannerData;
  weekStart: Date;
  weekKey: string;
  week: WeekPlan;
  setWeekStart: (date: Date) => void;
  setStudentName: (name: string) => void;
  setWeekLabel: (label: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  updateSlot: (slotId: string, patch: Partial<Omit<Slot, "id">>) => void;
  addActivity: (activity: NewActivity) => void;
  updateActivity: (id: string, patch: Partial<Omit<Activity, "id">>) => void;
  removeActivity: (id: string) => void;
  toggleActivity: (id: string) => void;
  addTile: (tile: Omit<Tile, "id">) => void;
  removeTile: (id: string) => void;
  setQuotes: (quotes: string[]) => void;
  clearWeek: () => void;
  restoreSnapshot: (snapshot: WeekPlan) => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PlannerData>(() => defaultData());
  const [weekStart, setWeekStartState] = useState<Date>(() => startOfPersianWeek(new Date()));
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    setData(loadData());
    setReady(true);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveData(data);
  }, [data]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", data.settings.theme === "dark");
  }, [data.settings.theme]);

  const weekKey = dateKey(weekStart);
  const week = data.weeks[weekKey] ?? emptyWeek();

  const mutateWeek = useCallback(
    (updater: (week: WeekPlan) => WeekPlan) => {
      setData((prev) => {
        const current = prev.weeks[weekKey] ?? emptyWeek();
        return { ...prev, weeks: { ...prev.weeks, [weekKey]: updater(current) } };
      });
    },
    [weekKey],
  );

  const value = useMemo<PlannerContextValue>(() => {
    return {
      ready,
      data,
      weekStart,
      weekKey,
      week,
      setWeekStart: (date) => setWeekStartState(startOfPersianWeek(date)),
      setStudentName: (studentName) =>
        setData((prev) => ({ ...prev, settings: { ...prev.settings, studentName } })),
      setWeekLabel: (label) => mutateWeek((w) => ({ ...w, label })),
      setTheme: (theme) => setData((prev) => ({ ...prev, settings: { ...prev.settings, theme } })),
      updateSlot: (slotId, patch) =>
        setData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            slots: prev.settings.slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)),
          },
        })),
      addActivity: (activity) =>
        mutateWeek((w) => ({
          ...w,
          activities: [...w.activities, { ...activity, done: activity.done ?? false, id: createId() }],
        })),
      updateActivity: (id, patch) =>
        mutateWeek((w) => ({
          ...w,
          activities: w.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeActivity: (id) =>
        mutateWeek((w) => ({ ...w, activities: w.activities.filter((a) => a.id !== id) })),
      toggleActivity: (id) =>
        mutateWeek((w) => ({
          ...w,
          activities: w.activities.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
        })),
      addTile: (tile) =>
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, tiles: [...prev.settings.tiles, { ...tile, id: createId() }] },
        })),
      removeTile: (id) =>
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, tiles: prev.settings.tiles.filter((t) => t.id !== id) },
        })),
      setQuotes: (quotes) =>
        setData((prev) => ({ ...prev, settings: { ...prev.settings, quotes } })),
      clearWeek: () => mutateWeek((w) => ({ ...w, activities: [] })),
      restoreSnapshot: (snapshot) => mutateWeek(() => snapshot),
      exportJSON: () => JSON.stringify(data, null, 2),
      importJSON: (json) => {
        try {
          setData(normalizeData(JSON.parse(json)));
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [data, mutateWeek, ready, week, weekKey, weekStart]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}
