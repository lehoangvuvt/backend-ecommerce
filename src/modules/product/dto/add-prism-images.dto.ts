import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export default class AddPrismImagesDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    IMAGE1_URL: string;

    @IsNotEmpty()
    @IsString()
    IMAGE2_URL: string;

    @IsNotEmpty()
    @IsString()
    IMAGE3_URL: string;
}