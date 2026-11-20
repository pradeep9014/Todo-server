jest.mock('src/user/user.service', () => ({
  UserService: class MockUserService { },
}), { virtual: true });

jest.mock('@nestjs/jwt', () => ({
  JwtService: class MockJwtService { },
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UserService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // SIGNUP TESTS

  describe('signup', () => {
    const signupDto = {
      username: 'pradeep',
      password: 'password123',
      name: 'Pradeep',
    };

    it('should register a new user successfully', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ id: 1 });

      const result = await service.signup(signupDto);

      expect(result).toEqual({
        success: true,
        message: 'User registered successfully',
      });

      expect(mockUsersService.findByUsername)
        .toHaveBeenCalledWith('pradeep');

      expect(mockUsersService.create).toHaveBeenCalled();

      const createArgument =
        mockUsersService.create.mock.calls[0][0];

      expect(createArgument.username).toBe('pradeep');
      expect(createArgument.name).toBe('Pradeep');
      expect(createArgument.password).not.toBe('password123');

      expect(
        await bcrypt.compare(
          'password123',
          createArgument.password,
        ),
      ).toBe(true);
    });

    it('should throw ConflictException if username already exists', async () => {
      mockUsersService.findByUsername.mockResolvedValue({
        id: 1,
        username: 'pradeep',
      });

      await expect(service.signup(signupDto))
        .rejects.toThrow(ConflictException);

      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should handle duplicate username database errors', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      mockUsersService.create.mockRejectedValue({
        code: 'ER_DUP_ENTRY',
      });

      await expect(service.signup(signupDto))
        .rejects.toThrow(ConflictException);
    });

    it('should trim whitespace from name', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ id: 1 });

      await service.signup({ ...signupDto, name: '  Pradeep  ' });

      const createArgument = mockUsersService.create.mock.calls[0][0];
      expect(createArgument.name).toBe('Pradeep');
    });

    it('should hash the password with bcrypt salt rounds of 12', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ id: 1 });

      await service.signup(signupDto);

      const createArgument = mockUsersService.create.mock.calls[0][0];
      expect(createArgument.password).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare('password123', createArgument.password)).toBe(true);
    });

    it('should re-throw non-duplicate-entry errors', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const genericError = new Error('Connection lost');
      mockUsersService.create.mockRejectedValue(genericError);

      await expect(service.signup(signupDto))
        .rejects.toThrow('Connection lost');
    });
  });

  // SIGNIN TESTS

  describe('signin', () => {
    const signinDto = {
      username: 'pradeep',
      password: 'password123',
    };

    it('should login successfully and return access token', async () => {
      const hashedPassword = await bcrypt.hash(
        'password123',
        12,
      );

      mockUsersService.findByUsername.mockResolvedValue({
        id: 1,
        username: 'pradeep',
        password: hashedPassword,
      });

      mockJwtService.signAsync.mockResolvedValue('mock-access-token');

      const result = await service.signin(signinDto);

      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: 'mock-access-token',
        },
      });

      expect(mockUsersService.findByUsername)
        .toHaveBeenCalledWith('pradeep');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        email: 'pradeep',
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.signin(signinDto))
        .rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash(
        'differentPassword',
        12,
      );

      mockUsersService.findByUsername.mockResolvedValue({
        id: 1,
        username: 'pradeep',
        password: hashedPassword,
      });

      await expect(service.signin(signinDto))
        .rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should construct JWT payload with user id as sub and username as email', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);

      mockUsersService.findByUsername.mockResolvedValue({
        id: 42,
        username: 'testuser',
        password: hashedPassword,
      });

      mockJwtService.signAsync.mockResolvedValue('token-xyz');

      await service.signin({ username: 'testuser', password: 'password123' });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 42,
        email: 'testuser',
      });
    });

    it('should re-throw unexpected errors from signin', async () => {
      mockUsersService.findByUsername.mockRejectedValue(
        new Error('DB connection failed'),
      );

      await expect(service.signin(signinDto))
        .rejects.toThrow('DB connection failed');
    });
  });
});
