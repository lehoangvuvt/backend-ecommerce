import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromotionController } from "./promotion.controller";
import Promotion from "./promotion.entity";
import PromotionService from "./promotion.service";
import PromotionPriceLevel from "./promotion_price_level.entity";
import PromotionValidationCustomerLoyalty from "./promotion_validation_customer_loyalty.entity";
// import PromotionPriority from "./promotion_priority.entity";
import PromotionValidationFilterElement from "./promotion_validation_filter_element.entity";
import PromotionValidationItemRule from "./promotion_validation_item_rule.entity";
import PromotionImages from "./promotion_images.entity";
import PromotionRewardDiscountItem from "./promotion_reward_discount_item.entity";
import PromotionPriority from "./promotion_priority.entity";
import Product from "../product/product.entity";

@Module({
    imports: [TypeOrmModule.forFeature([
        Promotion, PromotionPriceLevel, PromotionValidationItemRule, PromotionValidationFilterElement, PromotionValidationCustomerLoyalty, PromotionImages, 
        PromotionRewardDiscountItem, PromotionPriority, Product
        // PromotionPriority
    ]), 
        JwtModule.register({})
    ],
    controllers: [PromotionController],
    providers: [PromotionService]

})

export class PromotionModule {};