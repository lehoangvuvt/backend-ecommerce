import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class CreateAttributeValueDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    SID_PRODUCT: string;

    @IsNotEmpty()
    @IsNumber()
    PRODUCT_ATTRIBUTE_ID: number;

    @IsNotEmpty()
    @IsNumber()
    PRODUCT_ATTRIBUTE_GROUP_ID: number;

    @IsOptional()
    @IsString()
    VALUE_VARCHAR: string;

    @IsOptional()
    @IsInt()
    VALUE_INT: number;

    @IsOptional()
    @IsNumber()
    VALUE_DECIMAL: number;

    @IsOptional()
    @IsString()
    VALUE_DATETIME: Date;
}