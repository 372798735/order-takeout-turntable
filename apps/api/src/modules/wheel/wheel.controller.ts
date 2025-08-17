import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { WheelService } from './wheel.service';

class CreateSetDto {
    @IsString()
    name!: string;
}

class UpdateSetDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    version?: number;
}

class CreateItemDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    color?: string | null;

    @IsInt()
    order!: number;
}

class UpdateItemDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    color?: string | null;

    @IsOptional()
    @IsInt()
    order?: number;
}

class ReorderDtoEntry {
    @IsString()
    id!: string;

    @IsInt()
    order!: number;
}

class ReorderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderDtoEntry)
    items!: ReorderDtoEntry[];
}

@UseGuards(AuthGuard('jwt'))
@Controller('wheel-sets')
export class WheelController {
    constructor(private readonly wheel: WheelService) { }

    @Get()
    list(@Req() req: any) {
        return this.wheel.listByUser(req.user.userId);
    }

    @Post()
    create(@Req() req: any, @Body() dto: CreateSetDto) {
        return this.wheel.createSet(req.user.userId, dto.name);
    }

    @Get(':id')
    get(@Req() req: any, @Param('id') id: string) {
        return this.wheel.getSet(req.user.userId, id);
    }

    @Patch(':id')
    update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSetDto) {
        return this.wheel.updateSet(req.user.userId, id, dto);
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id') id: string) {
        return this.wheel.deleteSet(req.user.userId, id);
    }

    @Post(':id/items')
    addItem(@Req() req: any, @Param('id') id: string, @Body() dto: CreateItemDto) {
        return this.wheel.addItem(req.user.userId, id, dto);
    }

    @Patch(':id/items/:itemId')
    updateItem(
        @Req() req: any,
        @Param('id') id: string,
        @Param('itemId') itemId: string,
        @Body() dto: UpdateItemDto,
    ) {
        return this.wheel.updateItem(req.user.userId, id, itemId, dto);
    }

    @Delete(':id/items/:itemId')
    deleteItem(@Req() req: any, @Param('id') id: string, @Param('itemId') itemId: string) {
        return this.wheel.deleteItem(req.user.userId, id, itemId);
    }

    @Post(':id/items:reorder')
    reorder(@Req() req: any, @Param('id') id: string, @Body() dto: ReorderDto) {
        return this.wheel.reorderItems(
            req.user.userId,
            id,
            dto.items.map((i) => ({ id: i.id, order: i.order })),
        );
    }
}


