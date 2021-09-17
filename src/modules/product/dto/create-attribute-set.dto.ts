import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export default class CreateAttributeSetDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    SET_NAME: string;

    @IsNotEmpty()
    @IsInt()
    ID_ATTRIBUTE_1: number;

    @IsNotEmpty()
    @IsInt()
    ID_ATTRIBUTE_2: number;
}
