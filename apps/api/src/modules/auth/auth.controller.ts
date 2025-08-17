import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;
}

class LoginDto {
    @IsEmail()
    email!: string;

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
        return this.auth.register(dto.email, dto.password);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.auth.login(dto.email, dto.password);
    }

    @Post('refresh')
    refresh(@Body() dto: RefreshDto) {
        return this.auth.refresh(dto.refreshToken);
    }
}


