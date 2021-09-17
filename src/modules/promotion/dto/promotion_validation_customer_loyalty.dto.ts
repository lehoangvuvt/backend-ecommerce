import { IsNotEmpty } from "class-validator";

class PromotionValidationCustomerLoyaltyDTO {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    LOYALTY_SID: string;
}

export default PromotionValidationCustomerLoyaltyDTO;