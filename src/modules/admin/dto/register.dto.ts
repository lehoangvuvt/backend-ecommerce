import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export default class RegisterDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    EMAIL: string;

    @IsNotEmpty()
    @MinLength(4)
    PASSWORD: string;

    @IsNotEmpty()
    FIRST_NAME: string;

    @IsNotEmpty()
    LAST_NAME: string;

    @IsNotEmpty()
    GENDER: string;
}