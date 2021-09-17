import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, ValidateNested } from "class-validator";
import PromotionValidationFilterElementDto from "./promotion_validation_filter_element.dto";

class PromotionValidationItemRuleDTO {
    @IsNotEmpty()
    @IsString()
    CREATED_BY: string;

    @IsNumber()
    SUBTOTAL: number;

    // @IsUUID()
    // @IsNotEmpty()
    // PROMOTION_SID: string;

    @IsArray()
    @ValidateNested({each:true})
    @Type(() => PromotionValidationFilterElementDto)
    filter_element: PromotionValidationFilterElementDto[];
}

export default PromotionValidationItemRuleDTO;