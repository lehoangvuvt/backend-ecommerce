import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export default class CreateProductDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    SID_PRODUCT_INFORMATION: string;

    @IsNotEmpty()
    @IsNumber()
    QTY: number;

    @IsOptional()
    @IsString()
    UPC: string;
}