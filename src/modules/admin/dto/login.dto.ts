import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export default class LoginDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    EMAIL: string;

    @IsNotEmpty()
    @MinLength(4)
    PASSWORD: string;
}