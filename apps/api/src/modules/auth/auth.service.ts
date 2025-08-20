import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly jwt: JwtService,
    ) { }

    async register(email: string | undefined, password: string, phone?: string) {
        const existing = email ? await this.users.findByEmail(email) : phone ? await this.users.findByPhone(phone) : null;
        if (existing) {
            throw new UnauthorizedException('Account already registered');
        }
        const hash = await bcrypt.hash(password, 10);
        const randomNick = `用户${Math.floor(100 + Math.random() * 900)}`;
        const user = await this.users.create(email || `p-${phone}@phone.local`, hash, { phone, nickname: randomNick });
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
        const refreshToken = await this.jwt.signAsync(
            { sub: user.id, email: user.email },
            { expiresIn: '7d' },
        );
        return { accessToken, refreshToken, user: { id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, gender: user.gender } };
    }

    async login(email: string | undefined, password: string, phone?: string) {
        const user = email ? await this.users.findByEmail(email) : phone ? await this.users.findByPhone(phone) : null;
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new UnauthorizedException('Invalid credentials');
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
        const refreshToken = await this.jwt.signAsync(
            { sub: user.id, email: user.email },
            { expiresIn: '7d' },
        );
        return { accessToken, refreshToken, user: { id: user.id, email: user.email, nickname: user.nickname, avatar: user.avatar, gender: user.gender } };
    }

    async refresh(token: string) {
        try {
            const payload = await this.jwt.verifyAsync(token);
            const accessToken = await this.jwt.signAsync({ sub: payload.sub, email: payload.email });
            return { accessToken };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}


