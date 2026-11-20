import {
    IsNotEmpty,
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class SignupDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsNotEmpty()
    @MaxLength(150)
    @IsString()
    username: string;

    @IsString()
    @MinLength(8)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        {
            message: 'Password must contain uppercase, lowercase, number and special character',
        },
    )
    password: string;
}


export class SigninDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}