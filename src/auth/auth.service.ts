import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SigninDto, SignupDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {

    constructor(private readonly usersService: UserService,
        private readonly jwtService: JwtService,) { }

    async signup(dto: SignupDto) {

        try {
            const { username, password, name } = dto
            const existingUser = await this.usersService.findByUsername(username);

            if (existingUser) {
                throw new ConflictException('Username already registered');
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            await this.usersService.create({
                name: name.trim(),
                username,
                password: hashedPassword,
            });
            return {
                success: true,
                message: 'User registered successfully',
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('Username already registered');
            }

            throw error;
        }
    }

    async signin(dto: SigninDto) {
        try {
            const { username, password } = dto
            const user = await this.usersService.findByUsername(
                username
            );
            if (
                !user ||
                !(await bcrypt.compare(dto.password, user.password))
            ) {
                throw new UnauthorizedException('Invalid credentials');
            }
            const payload = {
                sub: user.id,
                email: user.username,
            };

            const accessToken = await this.jwtService.signAsync(payload);
            return {
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                },
            };
        } catch (error) {
            throw error;
        }
    }

}
