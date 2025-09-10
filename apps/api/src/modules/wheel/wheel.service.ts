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

    // 验证项目是否存在且属于该套餐
    const existingItem = await this.prisma.wheelItem.findFirst({
      where: { id: itemId, setId },
    });
    if (!existingItem) throw new NotFoundException('Wheel item not found');

    return this.prisma.wheelItem.update({
      where: { id: itemId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.order !== undefined && { order: data.order }),
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

    // 验证所有项目都存在且属于该套餐
    const existingItems = await this.prisma.wheelItem.findMany({
      where: { setId, id: { in: orders.map((o) => o.id) } },
      select: { id: true },
    });

    const existingIds = new Set(existingItems.map((item) => item.id));
    const validOrders = orders.filter((o) => existingIds.has(o.id));

    if (validOrders.length === 0) {
      throw new NotFoundException('No valid wheel items found for reordering');
    }

    await this.prisma.$transaction(
      validOrders.map((o) =>
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

  async batchUpdateSet(
    userId: string,
    setId: string,
    data: {
      name?: string;
      items?: Array<{
        id?: string;
        name: string;
        description?: string | null;
        color?: string | null;
        order: number;
      }>;
    },
  ) {
    // 验证套餐所有权
    const set = await this.prisma.wheelSet.findFirst({
      where: { id: setId, userId },
      include: { items: true },
    });
    if (!set) {
      throw new Error('Wheel set not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 更新套餐名称
      if (data.name !== undefined) {
        await tx.wheelSet.update({
          where: { id: setId },
          data: { name: data.name },
        });
      }

      // 处理items
      if (data.items !== undefined) {
        const currentItems = set.items;
        const newItems = data.items;

        // 收集现有和新的ID
        const currentIds = new Set(currentItems.map((item) => item.id));
        const newIds = new Set(newItems.filter((item) => item.id).map((item) => item.id!));
        const newItemIds = new Set<string>();

        // 删除不在新列表中的items
        const idsToDelete = currentItems
          .filter((item) => !newIds.has(item.id))
          .map((item) => item.id);

        if (idsToDelete.length > 0) {
          await tx.wheelItem.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // 处理新items和更新现有items
        for (const item of newItems) {
          if (item.id && currentIds.has(item.id)) {
            // 验证项目是否仍然存在（避免并发删除问题）
            const existsInDb = await tx.wheelItem.findFirst({
              where: { id: item.id, setId },
            });

            if (existsInDb) {
              // 更新现有item
              await tx.wheelItem.update({
                where: { id: item.id },
                data: {
                  name: item.name,
                  description: item.description ?? null,
                  color: item.color ?? null,
                  order: item.order,
                },
              });
            } else {
              // 如果项目不存在，创建新的
              const created = await tx.wheelItem.create({
                data: {
                  setId,
                  name: item.name,
                  description: item.description ?? null,
                  color: item.color ?? null,
                  order: item.order,
                },
              });
              newItemIds.add(created.id);
            }
          } else {
            // 创建新item
            const created = await tx.wheelItem.create({
              data: {
                setId,
                name: item.name,
                description: item.description ?? null,
                color: item.color ?? null,
                order: item.order,
              },
            });
            newItemIds.add(created.id);
          }
        }
      }

      // 返回更新后的完整数据
      return await tx.wheelSet.findFirst({
        where: { id: setId, userId },
        include: { items: { orderBy: { order: 'asc' } } },
      });
    });
  }
}
