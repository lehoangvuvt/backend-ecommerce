import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class CreateAttributeGroupDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    PRODUCT_INFORMATION_SID: string;

    @IsNotEmpty()
    @IsInt()
    GROUP_ATTRIBUTE_ID: number;

    @IsOptional()
    @IsString()
    GROUP_VALUE_VARCHAR: string;

    @IsOptional()
    @IsInt()
    GROUP_VALUE_INT: number;

    @IsOptional()
    @IsNumber()
    GROUP_VALUE_DECIMAL: number;

    @IsOptional()
    @IsString()
    GROUP_VALUE_DATETIME: Date;
}