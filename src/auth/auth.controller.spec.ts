import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      signin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup with signup dto and return result', async () => {
      const signupDto: SignupDto = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'Password123!',
      };

      const expectedResponse = {
        success: true,
        message: 'User registered successfully',
      };

      (authService.signup as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.signup(signupDto);

      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from authService.signup', async () => {
      const signupDto: SignupDto = {
        name: 'Jane Doe',
        username: 'janedoe',
        password: 'Password123!',
      };

      (authService.signup as jest.Mock).mockRejectedValue(new Error('Signup failed'));

      await expect(controller.signup(signupDto)).rejects.toThrow('Signup failed');
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
    });
  });

  describe('signin', () => {
    it('should call authService.signin with signin dto and return token payload', async () => {
      const signinDto: SigninDto = {
        username: 'janedoe',
        password: 'Password123!',
      };

      const expectedResponse = {
        success: true,
        message: 'Login successful',
        data: {
          accessToken: 'jwt.mock.token',
        },
      };

      (authService.signin as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.signin(signinDto);

      expect(authService.signin).toHaveBeenCalledWith(signinDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from authService.signin', async () => {
      const signinDto: SigninDto = {
        username: 'janedoe',
        password: 'WrongPassword',
      };

      (authService.signin as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.signin(signinDto)).rejects.toThrow('Invalid credentials');
      expect(authService.signin).toHaveBeenCalledWith(signinDto);
    });
  });
});
