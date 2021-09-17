import { IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

class PromotionValidationFilterElementDto {
    @IsNotEmpty()
    @IsString()
    CREATED_BY: string;

    @IsString()
    @IsNotEmpty()
    FIELD: string;

    @IsNotEmpty()
    @IsNumber()
    OPERATOR: number;

    @IsString()
    @IsNotEmpty()
    OPERAND: string;

    @IsNumber()
    @IsNotEmpty()
    JOIN_OPERATOR: number;

    // @IsNotEmpty()
    // @IsUUID()
    // RULE_SID: string;   
}

export default PromotionValidationFilterElementDto;