import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    username: 'johndoe',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUsername', () => {
    it('should return a user if found by username', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByUsername('johndoe');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'johndoe' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found by username', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user if found by id', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found by id', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('999');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '999' },
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const userData: Partial<User> = {
        name: 'John Doe',
        username: 'johndoe',
        password: 'hashedPassword',
      };

      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (userRepository.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(userData);

      expect(userRepository.create).toHaveBeenCalledWith(userData);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
