import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class LoginPrismDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    USERNAME: string;

    @IsNotEmpty()
    @IsString()
    PASSWORD: string;
}