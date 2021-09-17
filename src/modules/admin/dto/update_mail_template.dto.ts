import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export default class UpdateMailTemplateDetailsDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    MAIL_CONTENTS: string;

    @IsNotEmpty()
    @IsString()
    MAIL_SUBJECT: string;
}
