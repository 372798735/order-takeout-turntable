import { Body, Controller, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatar?: string;

  @IsOptional()
  @IsString()
  @IsIn(['UNKNOWN', 'MALE', 'FEMALE'])
  gender?: 'UNKNOWN' | 'MALE' | 'FEMALE';
}

@UseGuards(AuthGuard('jwt'))
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async getMe(@Req() req: any) {
    const user = await this.users.findById(req.user.userId);
    return {
      id: user?.id,
      email: user?.email,
      phone: user?.phone,
      nickname: user?.nickname,
      avatar: user?.avatar,
      gender: user?.gender,
    };
  }

  @Patch()
  async updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.users.updateProfile(req.user.userId, dto);
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      gender: user.gender,
    };
  }
}
