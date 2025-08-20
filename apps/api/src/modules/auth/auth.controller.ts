import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @Matches(/^1[3-9]\d{9}$/)
    phone?: string;

    @IsString()
    @MinLength(6)
    password!: string;
}

class LoginDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @Matches(/^1[3-9]\d{9}$/)
    phone?: string;

    @IsString()
    password!: string;
}

class RefreshDto {
    @IsString()
    refreshToken!: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @Post('register')
    register(@Body() dto: RegisterDto) {
        if (!dto.email && !dto.phone) throw new BadRequestException('phone or email is required');
        return this.auth.register(dto.email, dto.password, dto.phone);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        if (!dto.email && !dto.phone) throw new BadRequestException('phone or email is required');
        return this.auth.login(dto.email, dto.password, dto.phone);
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshDto) {
        return this.auth.refresh(dto.refreshToken);
    }
}


