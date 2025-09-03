import { defineStore } from 'pinia';
import { api } from '@/api/client';

export interface WheelItem {
  id: string;
  name: string;
  description?: string; // 备注字段
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

const STORAGE_KEY = 'wheel-turntable-data'; // 仅用于兼容一次性导入

function nowISO() {
  return new Date().toISOString();
}

export const useWheelStore = defineStore('wheel', {
  state: (): AppState => ({
    wheelSets: [],
    currentWheelSetId: null,
    isSpinning: false,
    lastResult: null,
  }),
  getters: {
    currentSet(state): WheelSet | null {
      return state.wheelSets.find((s) => s.id === state.currentWheelSetId) || null;
    },
  },
  actions: {
    async load() {
      // 1) 如果数据库为空且本地有旧数据，尝试导入一次
      try {
        const list = await api.get<WheelSet[]>('/wheel-sets');
        if (!list || list.length === 0) {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const payload = JSON.parse(raw);
            try {
              await api.post('/wheel-sets/import', payload);
            } catch {}
          }
        }
      } catch {}

      // 2) 拉取数据库数据
      const sets = await api.get<WheelSet[]>('/wheel-sets');
      this.wheelSets = sets;
      if (!this.currentWheelSetId && this.wheelSets.length > 0) {
        this.currentWheelSetId = this.wheelSets[0].id;
      }
    },
    // 持久化仅保留运行态（不再写入本地存储业务数据）
    save() {
      const data: AppState = {
        wheelSets: this.wheelSets,
        currentWheelSetId: this.currentWheelSetId,
        isSpinning: this.isSpinning,
        lastResult: this.lastResult,
      };
      try {
        localStorage.setItem(STORAGE_KEY + '-runtime', JSON.stringify(data));
      } catch {}
    },
    async bootstrap() {
      // 数据库版无需本地 demo，改为若无数据则创建一个默认套餐
      const created = await api.post<WheelSet>('/wheel-sets', { name: '今天吃什么' });
      this.wheelSets = [{ ...created, items: [] }];
      this.currentWheelSetId = created.id;
      this.isSpinning = false;
      this.lastResult = null;
      this.save();
    },
    setCurrentSet(id: string) {
      this.currentWheelSetId = id;
      this.save();
    },
    async addSet(name: string) {
      const created = await api.post<WheelSet>('/wheel-sets', { name });
      const detail = await api.get<WheelSet>(`/wheel-sets/${created.id}`);
      this.wheelSets.unshift(detail);
      this.currentWheelSetId = created.id;
      this.save();
    },
    async renameSet(id: string, name: string) {
      await api.patch(`/wheel-sets/${id}`, { name });
      const detail = await api.get<WheelSet>(`/wheel-sets/${id}`);
      const idx = this.wheelSets.findIndex((s) => s.id === id);
      if (idx >= 0) this.wheelSets[idx] = detail;
      this.save();
    },
    async deleteSet(id: string) {
      await api.delete(`/wheel-sets/${id}`);
      const idx = this.wheelSets.findIndex((s) => s.id === id);
      if (idx >= 0) this.wheelSets.splice(idx, 1);
      if (this.currentWheelSetId === id) {
        this.currentWheelSetId = this.wheelSets[0]?.id ?? null;
      }
      this.save();
    },
    async addItem(setId: string, name: string) {
      const s = this.wheelSets.find((x) => x.id === setId);
      if (!s) return;
      const order = s.items.length;
      await api.post(`/wheel-sets/${setId}/items`, { name, order });
      const detail = await api.get<WheelSet>(`/wheel-sets/${setId}`);
      const idx = this.wheelSets.findIndex((x) => x.id === setId);
      if (idx >= 0) this.wheelSets[idx] = detail;
      this.save();
    },
    async removeItem(setId: string, itemId: string) {
      await api.delete(`/wheel-sets/${setId}/items/${itemId}`);
      const detail = await api.get<WheelSet>(`/wheel-sets/${setId}`);
      const idx = this.wheelSets.findIndex((x) => x.id === setId);
      if (idx >= 0) this.wheelSets[idx] = detail;
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
    async updateSet(setId: string, payload: { name?: string; items?: WheelItem[] }) {
      const s = this.wheelSets.find((x) => x.id === setId);
      if (!s) return;
      // 更新名称
      if (typeof payload.name === 'string') {
        await api.patch(`/wheel-sets/${setId}`, { name: payload.name });
      }
      // 对 items 做同步：
      if (Array.isArray(payload.items)) {
        // 先对现有项做增删改，再统一排序
        const current = await api.get<WheelSet>(`/wheel-sets/${setId}`);
        const existingIds = new Set(current.items.map((i) => i.id));
        const payloadIds = new Set(payload.items.map((i) => i.id));

        // 删除不存在的
        for (const it of current.items) {
          if (!payloadIds.has(it.id)) {
            await api.delete(`/wheel-sets/${setId}/items/${it.id}`);
          }
        }
        // 新增不存在的
        for (const [idx, it] of payload.items.entries()) {
          if (!existingIds.has(it.id)) {
            await api.post(`/wheel-sets/${setId}/items`, {
              name: it.name,
              description: it.description,
              order: idx,
            });
          } else {
            await api.patch(`/wheel-sets/${setId}/items/${it.id}`, {
              name: it.name,
              description: it.description,
            });
          }
        }
        // 统一排序
        await api.post(`/wheel-sets/${setId}/items:reorder`, {
          items: payload.items.map((it, idx) => ({ id: it.id, order: idx })),
        });
      }
      const detail = await api.get<WheelSet>(`/wheel-sets/${setId}`);
      const idx = this.wheelSets.findIndex((x) => x.id === setId);
      if (idx >= 0) this.wheelSets[idx] = detail;
      this.save();
    },
    async updateItemName(setId: string, itemId: string, name: string) {
      await api.patch(`/wheel-sets/${setId}/items/${itemId}`, { name });
      const detail = await api.get<WheelSet>(`/wheel-sets/${setId}`);
      const idx = this.wheelSets.findIndex((x) => x.id === setId);
      if (idx >= 0) this.wheelSets[idx] = detail;
      this.save();
    },
    async reorderItems(setId: string, fromIndex: number, toIndex: number) {
      const s = this.wheelSets.find((x) => x.id === setId);
      if (!s) return;
      const items = [...s.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      await api.post(`/wheel-sets/${setId}/items:reorder`, {
        items: items.map((it, idx) => ({ id: it.id, order: idx })),
      });
      const detail = await api.get<WheelSet>(`/wheel-sets/${setId}`);
      const idx = this.wheelSets.findIndex((x) => x.id === setId);
      if (idx >= 0) this.wheelSets[idx] = detail;
      this.save();
    },
  },
});
