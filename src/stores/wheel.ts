import { defineStore } from "pinia";

export interface WheelItem {
  id: string;
  name: string;
  color?: string;
}

export interface WheelSet {
  id: string;
  name: string;
  items: WheelItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  wheelSets: WheelSet[];
  currentWheelSetId: string | null;
  isSpinning: boolean;
  lastResult: WheelItem | null;
}

const STORAGE_KEY = "wheel-turntable-data";

function nowISO() {
  return new Date().toISOString();
}

export const useWheelStore = defineStore("wheel", {
  state: (): AppState => ({
    wheelSets: [],
    currentWheelSetId: null,
    isSpinning: false,
    lastResult: null,
  }),
  getters: {
    currentSet(state): WheelSet | null {
      return (
        state.wheelSets.find((s) => s.id === state.currentWheelSetId) || null
      );
    },
  },
  actions: {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: AppState = JSON.parse(raw);
          this.$patch(data);
        } else {
          this.bootstrap();
        }
      } catch {
        this.bootstrap();
      }
    },
    save() {
      const data: AppState = {
        wheelSets: this.wheelSets,
        currentWheelSetId: this.currentWheelSetId,
        isSpinning: this.isSpinning,
        lastResult: this.lastResult,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    bootstrap() {
      const demo: WheelSet = {
        id: "food",
        name: "今天吃什么",
        items: [
          { id: "1", name: "汉堡" },
          { id: "2", name: "披萨" },
          { id: "3", name: "寿司" },
          { id: "4", name: "麻辣烫" },
        ],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      this.wheelSets = [demo];
      this.currentWheelSetId = demo.id;
      this.isSpinning = false;
      this.lastResult = null;
      this.save();
    },
    setCurrentSet(id: string) {
      this.currentWheelSetId = id;
      this.save();
    },
    addSet(name: string) {
      const id = `${Date.now()}`;
      const set: WheelSet = {
        id,
        name,
        items: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      this.wheelSets.push(set);
      this.currentWheelSetId = id;
      this.save();
    },
    renameSet(id: string, name: string) {
      const s = this.wheelSets.find((s) => s.id === id);
      if (!s) return;
      s.name = name;
      s.updatedAt = nowISO();
      this.save();
    },
    deleteSet(id: string) {
      const idx = this.wheelSets.findIndex((s) => s.id === id);
      if (idx < 0) return;
      this.wheelSets.splice(idx, 1);
      if (this.currentWheelSetId === id) {
        this.currentWheelSetId = this.wheelSets[0]?.id ?? null;
      }
      this.save();
    },
    addItem(setId: string, name: string) {
      const s = this.wheelSets.find((s) => s.id === setId);
      if (!s) return;
      s.items.push({ id: `${Date.now()}`, name });
      s.updatedAt = nowISO();
      this.save();
    },
    removeItem(setId: string, itemId: string) {
      const s = this.wheelSets.find((s) => s.id === setId);
      if (!s) return;
      const idx = s.items.findIndex((i) => i.id === itemId);
      if (idx >= 0) s.items.splice(idx, 1);
      s.updatedAt = nowISO();
      this.save();
    },
    setSpinning(v: boolean) {
      this.isSpinning = v;
      this.save();
    },
    setResult(item: WheelItem | null) {
      this.lastResult = item;
      this.save();
    },
    updateSet(setId: string, payload: { name?: string; items?: WheelItem[] }) {
      const s = this.wheelSets.find((s) => s.id === setId);
      if (!s) return;
      if (typeof payload.name === "string") s.name = payload.name;
      if (Array.isArray(payload.items)) s.items = payload.items;
      s.updatedAt = nowISO();
      this.save();
    },
    updateItemName(setId: string, itemId: string, name: string) {
      const s = this.wheelSets.find((s) => s.id === setId);
      if (!s) return;
      const it = s.items.find((i) => i.id === itemId);
      if (!it) return;
      it.name = name;
      s.updatedAt = nowISO();
      this.save();
    },
    reorderItems(setId: string, fromIndex: number, toIndex: number) {
      const s = this.wheelSets.find((s) => s.id === setId);
      if (!s) return;
      const items = [...s.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      s.items = items;
      s.updatedAt = nowISO();
      this.save();
    },
  },
});
