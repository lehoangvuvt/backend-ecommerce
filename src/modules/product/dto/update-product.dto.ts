import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export default class UpdateProductDTO {
    @IsNotEmpty()
    @IsNumber()
    QTY: number;

    @IsNumber()
    ATTRIBUTE_VALUE_ID: number;

    @IsNotEmpty()
    NEW_ATTRIBUTE_VALUE: number | string;
}