import { BaseEntity, BeforeInsert, Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import PromotionValidationCustomerLoyalty from '../promotion/promotion_validation_customer_loyalty.entity'

@Entity() 
class CustomerLoyaltyLevel extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    ID: string;

    @Column("nvarchar", {nullable:true})
    DESCRIPTION: string;
    
    @Column("nvarchar")
    NAME: string;

    @Column("numeric")
    LOW_RANGE: number;

    @Column("numeric")
    UPPER_RANGE: number;
    
    @Column("float")
    EARN_MULTIPLIER: number;

    @Column("float")
    REDEEM_MULTIPLIER: number;

    @Column("nvarchar") 
    HEX_COLOR: string;

    @OneToOne(() => PromotionValidationCustomerLoyalty, promoValidateCustLoyalty => promoValidateCustLoyalty.loyaltyLevel )
    promoValidateCustLoyalty: PromotionValidationCustomerLoyalty;
}

export default CustomerLoyaltyLevel;