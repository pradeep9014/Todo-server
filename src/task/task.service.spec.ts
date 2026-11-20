jest.mock('@nestjs/typeorm', () => {
  const { Inject } = jest.requireActual('@nestjs/common');
  return {
    InjectRepository: (entity: any) => Inject(`${entity?.name ?? entity}Repository`),
    getRepositoryToken: (entity: any) => `${entity?.name ?? entity}Repository`,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('TaskService', () => {
  let service: TaskService;
  let repository: Repository<Task>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  // CREATE TASK TESTS

  describe('createTask', () => {
    const userId = 'user-123';

    const createTaskDto = {
      title: 'Learn NestJS',
      description: 'Complete NestJS unit testing',
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
    };

    it('should create a task successfully', async () => {
      const task = {
        id: 'task-123',
        ...createTaskDto,
        user: { id: userId },
      };

      mockRepository.create.mockReturnValue(task);
      mockRepository.save.mockResolvedValue(task);

      const result = await service.createTask(userId, createTaskDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        user: { id: userId },
      });

      expect(mockRepository.save).toHaveBeenCalledWith(task);
      expect(result).toEqual(task);
    });

    it('should throw an error if task creation fails', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createTask(userId, createTaskDto),
      ).rejects.toThrow('Database error');
    });

    it('should associate the task with the correct user', async () => {
      const task = { id: 'task-456', ...createTaskDto, user: { id: userId } };
      mockRepository.create.mockReturnValue(task);
      mockRepository.save.mockResolvedValue(task);

      await service.createTask(userId, createTaskDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ user: { id: userId } }),
      );
    });

    it('should spread dto fields into the created task', async () => {
      const minimalDto = { title: 'Minimal task' };
      const createdTask = { id: 'task-789', title: 'Minimal task', user: { id: userId } };
      mockRepository.create.mockReturnValue(createdTask);
      mockRepository.save.mockResolvedValue(createdTask);

      const result = await service.createTask(userId, minimalDto as any);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...minimalDto,
        user: { id: userId },
      });
      expect(result).toEqual(createdTask);
    });
  });

  // FETCH ALL TASKS TESTS

  describe('fetchAllTasks', () => {
    const userId = 'user-123';

    it('should fetch all tasks successfully', async () => {
      const tasks = [
        {
          id: 'task-1',
          title: 'Learn NestJS',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
        },
        {
          id: 'task-2',
          title: 'Learn TypeORM',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        },
      ];

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        tasks,
        2,
      ]);

      const result = await service.fetchAllTasks(userId, {});

      expect(mockRepository.createQueryBuilder)
        .toHaveBeenCalledWith('task');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'task.userId = :userId',
        { userId },
      );

      expect(mockQueryBuilder.orderBy)
        .toHaveBeenCalledWith('task.createdAt', 'DESC');

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        success: true,
        data: tasks,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
        },
      });
    });

    it('should filter tasks by status', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.fetchAllTasks(userId, {
        status: TaskStatus.PENDING,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatus.PENDING },
      );
    });

    it('should filter tasks by priority', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.fetchAllTasks(userId, {
        priority: TaskPriority.HIGH,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.priority = :priority',
        { priority: TaskPriority.HIGH },
      );
    });

    it('should search tasks by title and description', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.fetchAllTasks(userId, {
        search: 'NestJS',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: '%NestJS%' },
      );
    });

    it('should apply pagination and sorting', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.fetchAllTasks(userId, {
        page: 3,
        limit: 5,
        sortBy: 'title',
        sortOrder: 'ASC',
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'task.title',
        'ASC',
      );
    });

    it('should return empty tasks when no records exist', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.fetchAllTasks(userId, {});

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter by both status and priority simultaneously', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.fetchAllTasks(userId, {
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.LOW,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatus.IN_PROGRESS },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.priority = :priority',
        { priority: TaskPriority.LOW },
      );
    });

    it('should not apply search filter when search is empty or whitespace', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.fetchAllTasks(userId, { search: '   ' });

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        '(task.title LIKE :search OR task.description LIKE :search)',
        expect.anything(),
      );
    });

    it('should use default pagination values when not provided', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.fetchAllTasks(userId, {});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1-1)*10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  // FETCH TASK BY ID TESTS

  describe('fetchTaskById', () => {
    const userId = 'user-123';
    const taskId = 'task-123';

    it('should fetch a task by ID successfully', async () => {
      const task = {
        id: taskId,
        title: 'Learn NestJS',
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(task);

      const result = await service.fetchTaskById(userId, taskId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: taskId,
          user: { id: userId },
        },
      });

      expect(result).toEqual({
        message: 'Fetch Successful',
        task,
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.fetchTaskById(userId, taskId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only return tasks belonging to the given user', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.fetchTaskById('other-user', taskId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: taskId,
          user: { id: 'other-user' },
        },
      });
    });
  });

  // UPDATE TASK TESTS

  describe('updateTask', () => {
    const userId = 'user-123';
    const taskId = 'task-123';

    const updateTaskDto = {
      title: 'Updated NestJS Task',
      status: TaskStatus.IN_PROGRESS,
    };

    it('should update a task successfully', async () => {
      const task: any = {
        id: taskId,
        title: 'Learn NestJS',
        status: TaskStatus.PENDING,
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(task);
      mockRepository.save.mockResolvedValue({
        ...task,
        ...updateTaskDto,
      });

      const result = await service.updateTask(
        userId,
        taskId,
        updateTaskDto,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: userId },
          id: taskId,
        },
      });

      expect(task.title).toBe(updateTaskDto.title);
      expect(task.status).toBe(updateTaskDto.status);

      expect(mockRepository.save).toHaveBeenCalledWith(task);

      expect(result).toEqual({
        message: 'Update successful',
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTask(userId, taskId, updateTaskDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should merge partial update fields using Object.assign', async () => {
      const task: any = {
        id: taskId,
        title: 'Original Title',
        description: 'Original Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(task);
      mockRepository.save.mockResolvedValue(task);

      await service.updateTask(userId, taskId, { title: 'New Title' });

      expect(task.title).toBe('New Title');
      expect(task.description).toBe('Original Description');
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.priority).toBe(TaskPriority.LOW);
    });

    it('should update only the status field', async () => {
      const task: any = {
        id: taskId,
        title: 'Learn NestJS',
        status: TaskStatus.PENDING,
        user: { id: userId },
      };

      mockRepository.findOne.mockResolvedValue(task);
      mockRepository.save.mockResolvedValue(task);

      await service.updateTask(userId, taskId, {
        status: TaskStatus.COMPLETED,
      });

      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.title).toBe('Learn NestJS');
    });
  });

  // DELETE TASK TESTS

  describe('deleteTask', () => {
    const userId = 'user-123';
    const taskId = 'task-123';

    it('should delete a task successfully', async () => {
      const task = {
        id: taskId,
        title: 'Learn NestJS',
        user: { id: userId },
      } as Task;

      mockRepository.findOne.mockResolvedValue(task);
      mockRepository.softRemove.mockResolvedValue(task);

      const result = await service.deleteTask(userId, taskId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: taskId,
          user: { id: userId },
        },
      });

      expect(mockRepository.softRemove).toHaveBeenCalledWith(task);

      expect(result).toEqual({
        message: 'Task deleted successfully',
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteTask(userId, taskId),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.softRemove).not.toHaveBeenCalled();
    });

    it('should use softRemove instead of hard delete', async () => {
      const task = { id: taskId, user: { id: userId } } as Task;
      mockRepository.findOne.mockResolvedValue(task);
      mockRepository.softRemove.mockResolvedValue(task);

      await service.deleteTask(userId, taskId);

      expect(mockRepository.softRemove).toHaveBeenCalledWith(task);
      // Ensure hard-delete methods are not called
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should re-throw database errors', async () => {
      const task = { id: taskId, user: { id: userId } } as Task;
      mockRepository.findOne.mockResolvedValue(task);
      mockRepository.softRemove.mockRejectedValue(new Error('DB write failure'));

      await expect(
        service.deleteTask(userId, taskId),
      ).rejects.toThrow('DB write failure');
    });
  });

  // DASHBOARD STATS TESTS

  describe('getDashboardStats', () => {
    const userId = 'user-123';

    it('should return dashboard statistics successfully', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '10',
        pending: '3',
        inProgress: '2',
        completed: '5',
        high: '4',
        medium: '3',
        low: '3',
      });

      const result = await service.getDashboardStats(userId);

      expect(mockRepository.createQueryBuilder)
        .toHaveBeenCalledWith('task');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'task.userId = :userId',
        {
          userId,
          pending: TaskStatus.PENDING,
          inProgress: TaskStatus.IN_PROGRESS,
          completed: TaskStatus.COMPLETED,
          high: TaskPriority.HIGH,
          medium: TaskPriority.MEDIUM,
          low: TaskPriority.LOW,
        },
      );

      expect(result).toEqual({
        total: 10,
        status: {
          pending: 3,
          inProgress: 2,
          completed: 5,
        },
        priority: {
          high: 4,
          medium: 3,
          low: 3,
        },
      });
    });

    it('should return zero when no tasks exist', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: null,
        pending: null,
        inProgress: null,
        completed: null,
        high: null,
        medium: null,
        low: null,
      });

      const result = await service.getDashboardStats(userId);

      expect(result).toEqual({
        total: 0,
        status: {
          pending: 0,
          inProgress: 0,
          completed: 0,
        },
        priority: {
          high: 0,
          medium: 0,
          low: 0,
        },
      });
    });

    it('should convert string values from raw query to numbers', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '25',
        pending: '10',
        inProgress: '8',
        completed: '7',
        high: '12',
        medium: '8',
        low: '5',
      });

      const result = await service.getDashboardStats(userId);

      expect(typeof result.total).toBe('number');
      expect(typeof result.status.pending).toBe('number');
      expect(typeof result.status.inProgress).toBe('number');
      expect(typeof result.status.completed).toBe('number');
      expect(typeof result.priority.high).toBe('number');
      expect(typeof result.priority.medium).toBe('number');
      expect(typeof result.priority.low).toBe('number');
    });

    it('should handle lowercase inprogress from database driver', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Some DB drivers return column aliases in lowercase
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '5',
        pending: '1',
        inProgress: undefined,
        inprogress: '2',
        completed: '2',
        high: '1',
        medium: '3',
        low: '1',
      });

      const result = await service.getDashboardStats(userId);

      expect(result.status.inProgress).toBe(2);
    });

    it('should handle when getRawOne returns null', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.getDashboardStats(userId);

      expect(result).toEqual({
        total: 0,
        status: {
          pending: 0,
          inProgress: 0,
          completed: 0,
        },
        priority: {
          high: 0,
          medium: 0,
          low: 0,
        },
      });
    });

    it('should build the query with correct select statements', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '0', pending: '0', inProgress: '0',
        completed: '0', high: '0', medium: '0', low: '0',
      });

      await service.getDashboardStats(userId);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'COUNT(task.id)',
        'total',
      );
      // 6 addSelect calls for pending, inProgress, completed, high, medium, low
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledTimes(6);
    });
  });
});
