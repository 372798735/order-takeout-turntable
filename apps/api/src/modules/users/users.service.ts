import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(
    email: string,
    passwordHash: string,
    opts?: {
      phone?: string;
      nickname?: string;
      avatar?: string;
      gender?: 'UNKNOWN' | 'MALE' | 'FEMALE';
    },
  ) {
    return this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        phone: opts?.phone ?? null,
        nickname: opts?.nickname ?? null,
        avatar: opts?.avatar,
        gender: (opts?.gender as any) ?? 'UNKNOWN',
      },
    });
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; avatar?: string; gender?: 'UNKNOWN' | 'MALE' | 'FEMALE' },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
        ...(data.gender !== undefined ? { gender: data.gender as any } : {}),
      },
    });
  }
}
