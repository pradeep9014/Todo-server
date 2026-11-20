import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';
import { TaskPriority, TaskStatus } from './entities/task.entity';

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: jest.Mocked<Partial<TaskService>>;

  const mockUser = {
    sub: 'user-123',
    email: 'user@example.com',
  };

  const mockReq: any = {
    user: mockUser,
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    user: { id: 'user-123' },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    taskService = {
      createTask: jest.fn(),
      fetchAllTasks: jest.fn(),
      fetchTaskById: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      getDashboardStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: taskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTask', () => {
    it('should call taskService.createTask with userId and dto', async () => {
      const dto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        priority: TaskPriority.MEDIUM,
      };

      (taskService.createTask as jest.Mock).mockResolvedValue(mockTask);

      const result = await controller.createTask(mockReq, dto);

      expect(taskService.createTask).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toEqual(mockTask);
    });
  });

  describe('fetchAllTasks', () => {
    it('should call taskService.fetchAllTasks with userId and query dto', async () => {
      const query: TaskQueryDto = {
        page: 1,
        limit: 10,
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
      };

      const response = {
        success: true,
        data: [mockTask],
        pagination: { total: 1, page: 1, limit: 10 },
      };

      (taskService.fetchAllTasks as jest.Mock).mockResolvedValue(response);

      const result = await controller.fetchAllTasks(mockReq, query);

      expect(taskService.fetchAllTasks).toHaveBeenCalledWith(mockUser.sub, query);
      expect(result).toEqual(response);
    });
  });

  describe('getDashboardStats', () => {
    it('should call taskService.getDashboardStats with userId', async () => {
      const stats = {
        total: 5,
        status: { pending: 2, inProgress: 2, completed: 1 },
        priority: { high: 2, medium: 2, low: 1 },
      };

      (taskService.getDashboardStats as jest.Mock).mockResolvedValue(stats);

      const result = await controller.getDashboardStats(mockReq);

      expect(taskService.getDashboardStats).toHaveBeenCalledWith(mockUser.sub);
      expect(result).toEqual(stats);
    });
  });

  describe('fetchTaskById', () => {
    it('should call taskService.fetchTaskById with userId and task id', async () => {
      const response = {
        message: 'Fetch Successful',
        task: mockTask,
      };

      (taskService.fetchTaskById as jest.Mock).mockResolvedValue(response);

      const result = await controller.fetchTaskById(mockReq, 'task-1');

      expect(taskService.fetchTaskById).toHaveBeenCalledWith(mockUser.sub, 'task-1');
      expect(result).toEqual(response);
    });
  });

  describe('updateTask', () => {
    it('should call taskService.updateTask with userId, task id and dto', async () => {
      const dto: UpdateTaskDto = {
        status: TaskStatus.COMPLETED,
      };

      const response = {
        message: 'Update successful',
      };

      (taskService.updateTask as jest.Mock).mockResolvedValue(response);

      const result = await controller.updateTask(mockReq, 'task-1', dto);

      expect(taskService.updateTask).toHaveBeenCalledWith(mockUser.sub, 'task-1', dto);
      expect(result).toEqual(response);
    });
  });

  describe('deleteTask', () => {
    it('should call taskService.deleteTask with userId and task id', async () => {
      const response = {
        message: 'Task deleted successfully',
      };

      (taskService.deleteTask as jest.Mock).mockResolvedValue(response);

      const result = await controller.deleteTask(mockReq, 'task-1');

      expect(taskService.deleteTask).toHaveBeenCalledWith(mockUser.sub, 'task-1');
      expect(result).toEqual(response);
    });
  });
});
