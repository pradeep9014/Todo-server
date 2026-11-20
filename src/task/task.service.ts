import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) { }

  async createTask(userId: string, dto: CreateTaskDto) {
    try {
      const task = this.taskRepository.create({
        ...dto,
        user: { id: userId },
      });

      return this.taskRepository.save(task);
    } catch (error) {
      throw error
    }
  }


  async fetchAllTasks(userId: string, query: TaskQueryDto) {
    try {
      const {
        status,
        priority,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = query;


      const skip = (page - 1) * limit;
      const queryBuilder = this.taskRepository
        .createQueryBuilder('task')
        .where('task.userId = :userId', { userId });

      if (status) {
        queryBuilder.andWhere('task.status = :status', { status });
      }

      if (priority) {
        queryBuilder.andWhere('task.priority = :priority', {
          priority,
        });
      }

      if (search?.trim()) {
        queryBuilder.andWhere(
          '(task.title LIKE :search OR task.description LIKE :search)',
          { search: `%${search.trim()}%` },
        );
      }

      queryBuilder.orderBy(`task.${sortBy}`, sortOrder);


      queryBuilder.skip(skip).take(limit);

      const [tasks, total] = await queryBuilder.getManyAndCount();

      return {
        success: true,
        data: tasks,
        pagination: {
          total,
          page,
          limit
        },
      };

    } catch (error) {
      throw error;
    }
  }

  async fetchTaskById(userId: string, taskId: string) {
    try {
      const task = await this.taskRepository.findOne({
        where: {
          id: taskId,
          user: { id: userId },
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      return {
        message: "Fetch Successful",
        task: task
      }
    } catch (error) {
      throw error
    }
  }

  async updateTask(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    const task: any = await this.taskRepository.findOne({ where: { user: { id: userId }, id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    Object.assign(task, dto);

    await this.taskRepository.save(task);
    return {
      message: "Update successful"
    }
  }

  async deleteTask(userId: string, taskId: string) {
    try {
      const task = await this.taskRepository.findOne({
        where: {
          id: taskId,
          user: { id: userId },
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      await this.taskRepository.softRemove(task);

      return {
        message: 'Task deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async getDashboardStats(userId: string) {
    try {
      const raw = await this.taskRepository
        .createQueryBuilder('task')
        .select('COUNT(task.id)', 'total')
        .addSelect(
          `SUM(CASE WHEN task.status = :pending THEN 1 ELSE 0 END)`,
          'pending',
        )
        .addSelect(
          `SUM(CASE WHEN task.status = :inProgress THEN 1 ELSE 0 END)`,
          'inProgress',
        )
        .addSelect(
          `SUM(CASE WHEN task.status = :completed THEN 1 ELSE 0 END)`,
          'completed',
        )
        .addSelect(
          `SUM(CASE WHEN task.priority = :high THEN 1 ELSE 0 END)`,
          'high',
        )
        .addSelect(
          `SUM(CASE WHEN task.priority = :medium THEN 1 ELSE 0 END)`,
          'medium',
        )
        .addSelect(
          `SUM(CASE WHEN task.priority = :low THEN 1 ELSE 0 END)`,
          'low',
        )
        .where('task.userId = :userId', {
          userId,
          pending: TaskStatus.PENDING,
          inProgress: TaskStatus.IN_PROGRESS,
          completed: TaskStatus.COMPLETED,
          high: TaskPriority.HIGH,
          medium: TaskPriority.MEDIUM,
          low: TaskPriority.LOW,
        })
        .getRawOne();

      const total = Number(raw?.total || 0);
      const pending = Number(raw?.pending || 0);
      const inProgress = Number(raw?.inProgress ?? raw?.inprogress ?? 0);
      const completed = Number(raw?.completed || 0);
      const high = Number(raw?.high || 0);
      const medium = Number(raw?.medium || 0);
      const low = Number(raw?.low || 0);

      return {
        total,
        status: {
          pending,
          inProgress,
          completed,
        },
        priority: {
          high,
          medium,
          low,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
