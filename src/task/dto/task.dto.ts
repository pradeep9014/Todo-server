import {
    IsEnum,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

import { TaskPriority, TaskStatus } from '../entities/task.entity';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;
}



export class UpdateTaskDto extends PartialType(CreateTaskDto) {

    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;
}





export class TaskQueryDto {
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsIn(['createdAt', 'updatedAt', 'title', 'priority', 'status'])
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}