import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export default class CreateSenderMailDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    EMAIL_ADDRESS: string;

    @IsNotEmpty()
    PASSWORD: string;

    @IsNotEmpty()
    SERVICE_NAME: string;
}
