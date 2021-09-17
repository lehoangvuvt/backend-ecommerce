import { IsNotEmpty, IsNumber } from "class-validator";

export class CustomerLoyaltyRateDTO {
    @IsNotEmpty()
    @IsNumber()
    RATE: number;
}