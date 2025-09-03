import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WheelService {
  constructor(private readonly prisma: PrismaService) {}

  async listByUser(userId: string) {
    return this.prisma.wheelSet.findMany({
      where: { userId },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSet(userId: string, name: string) {
    return this.prisma.wheelSet.create({ data: { userId, name } });
  }

  async getSet(userId: string, id: string) {
    const set = await this.prisma.wheelSet.findFirst({
      where: { id, userId },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!set) throw new NotFoundException('Wheel set not found');
    return set;
  }

  async updateSet(userId: string, id: string, data: { name?: string; version?: number }) {
    const existing = await this.prisma.wheelSet.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Wheel set not found');
    return this.prisma.wheelSet.update({
      where: { id },
      data: { name: data.name ?? existing.name, version: (data.version ?? existing.version) + 1 },
    });
  }

  async deleteSet(userId: string, id: string) {
    await this.prisma.wheelItem.deleteMany({ where: { setId: id } });
    await this.prisma.wheelSet.delete({ where: { id } });
    return { ok: true };
  }

  async addItem(
    userId: string,
    setId: string,
    item: { name: string; description?: string | null; color?: string | null; order: number },
  ) {
    const set = await this.prisma.wheelSet.findFirst({ where: { id: setId, userId } });
    if (!set) throw new NotFoundException('Wheel set not found');
    return this.prisma.wheelItem.create({
      data: {
        setId,
        name: item.name,
        description: item.description ?? null,
        color: item.color ?? null,
        order: item.order,
      },
    });
  }

  async updateItem(
    userId: string,
    setId: string,
    itemId: string,
    data: { name?: string; description?: string | null; color?: string | null; order?: number },
  ) {
    const set = await this.prisma.wheelSet.findFirst({ where: { id: setId, userId } });
    if (!set) throw new NotFoundException('Wheel set not found');
    return this.prisma.wheelItem.update({
      where: { id: itemId },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        color: data.color ?? undefined,
        order: data.order ?? undefined,
      },
    });
  }

  async deleteItem(userId: string, setId: string, itemId: string) {
    const set = await this.prisma.wheelSet.findFirst({ where: { id: setId, userId } });
    if (!set) throw new NotFoundException('Wheel set not found');
    await this.prisma.wheelItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  async reorderItems(userId: string, setId: string, orders: { id: string; order: number }[]) {
    const set = await this.prisma.wheelSet.findFirst({ where: { id: setId, userId } });
    if (!set) throw new NotFoundException('Wheel set not found');
    await this.prisma.$transaction(
      orders.map((o) =>
        this.prisma.wheelItem.update({ where: { id: o.id }, data: { order: o.order } }),
      ),
    );
    return this.getSet(userId, setId);
  }

  async importFromLocal(userId: string, payload: any) {
    // payload example structure expected from localStorage
    // { wheelSets: [{ name, items: [{ name, color?, order }] }] }
    const sets = Array.isArray(payload?.wheelSets) ? payload.wheelSets : [];
    const results = [] as any[];
    for (const s of sets) {
      const created = await this.prisma.wheelSet.create({
        data: { userId, name: String(s.name || '未命名') },
      });
      const items = Array.isArray(s.items) ? s.items : [];
      if (items.length > 0) {
        await this.prisma.wheelItem.createMany({
          data: items.map((it: any, idx: number) => ({
            setId: created.id,
            name: String(it?.name || `Item ${idx + 1}`),
            color: it?.color ?? null,
            order: Number.isFinite(it?.order) ? Number(it.order) : idx,
          })),
        });
      }
      results.push(await this.getSet(userId, created.id));
    }
    return { imported: results.length, wheelSets: results };
  }
}
