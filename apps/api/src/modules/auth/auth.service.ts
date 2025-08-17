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

    async register(email: string, password: string) {
        const existing = await this.users.findByEmail(email);
        if (existing) {
            throw new UnauthorizedException('Email already registered');
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await this.users.create(email, hash);
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
        const refreshToken = await this.jwt.signAsync(
            { sub: user.id, email: user.email },
            { expiresIn: '7d' },
        );
        return { accessToken, refreshToken, user: { id: user.id, email: user.email } };
    }

    async login(email: string, password: string) {
        const user = await this.users.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new UnauthorizedException('Invalid credentials');
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
        const refreshToken = await this.jwt.signAsync(
            { sub: user.id, email: user.email },
            { expiresIn: '7d' },
        );
        return { accessToken, refreshToken, user: { id: user.id, email: user.email } };
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


