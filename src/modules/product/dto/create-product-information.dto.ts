import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export default class CreateProductInformationDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    SID_BRAND: string;

    @IsNotEmpty()
    SKU: string;

    @IsNotEmpty()
    @IsEnum(['Men', 'Women', 'Both'])
    PRODUCT_GENDER: 'Men' | 'Women' | 'Both';

    @IsNotEmpty()
    PRODUCT_NAME: string;

    @IsNotEmpty()
    LONG_DESCRIPTION: string;

    @IsNotEmpty()
    SHORT_DESCRIPTION: string;

    @IsNotEmpty()
    LONG_DESCRIPTION_TEXT: string;

    @IsNotEmpty()
    SHORT_DESCRIPTION_TEXT: string;

    @IsNotEmpty()
    @IsNumber()
    UNIT_PRICE: number;

    @IsNotEmpty()
    @IsNumber()
    TAX: number;

    @IsNotEmpty()
    @IsNumber()
    DISCOUNT: number;

    @IsOptional()
    @IsNumber()
    THRESHOLD: number;
    
}