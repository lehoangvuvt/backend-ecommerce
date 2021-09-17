import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export default class CreateProductBrandDTO {
    @ApiProperty()
    @IsNotEmpty()
    NAME: string;
}