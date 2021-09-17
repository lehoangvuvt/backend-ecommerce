import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export default class UpdateProductInformationDTO {
    @IsNotEmpty()
    @IsString()
    PRODUCT_NAME: string;

    @IsOptional()
    @IsNumber()
    UNIT_PRICE: number;

    @IsOptional()
    @IsNumber()
    TAX: number;

    @IsNotEmpty()
    @IsNumber()
    THRESHOLD: number;

    @IsNotEmpty()
    @IsEnum(['Men', 'Women', 'Both'])
    PRODUCT_GENDER: 'Men' | 'Women' | 'Both';

    @IsNotEmpty()
    @IsString()
    BRAND_SID: string;
}