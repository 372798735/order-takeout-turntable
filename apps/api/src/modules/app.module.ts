import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WheelModule } from './wheel/wheel.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [PrismaModule, AuthModule, UsersModule, WheelModule],
})
export class AppModule { }


