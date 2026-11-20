import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';

import { Request } from 'express';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';
import { TaskService } from './task.service';


interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('tasks')
export class TaskController {
  constructor(private readonly tasksService: TaskService) { }

  @Post()
  createTask(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTaskDto,
  ) {


    return this.tasksService.createTask(req.user.sub, dto);
  }

  @Get()
  fetchAllTasks(@Req() req: AuthenticatedRequest, @Query() query: TaskQueryDto) {
    return this.tasksService.fetchAllTasks(req.user.sub, query);
  }

  @Get('dashboard/stats')
  getDashboardStats(@Req() req: AuthenticatedRequest) {
    return this.tasksService.getDashboardStats(req.user.sub);
  }

  @Get(':id')
  fetchTaskById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.tasksService.fetchTaskById(req.user.sub, id);
  }

  @Patch(':id')
  updateTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(
      req.user.sub,
      id,
      dto,
    );
  }

  @Delete(':id')
  deleteTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.tasksService.deleteTask(req.user.sub, id);
  }
}