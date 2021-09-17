import { Entity, BaseEntity, PrimaryColumn, BeforeInsert, Column, ManyToOne, JoinColumn , OneToOne, BeforeUpdate} from "typeorm";
import {v4 as uuid} from 'uuid'
import Promotion from './promotion.entity'
import CustomerLoyaltyLevel from '../customer/customer_loyalty_level.entity'

@Entity()
class PromotionValidationCustomerLoyalty extends BaseEntity {
    @PrimaryColumn()
    SID: string;
    
    @Column("nvarchar")
    name: string;

    @Column("uuid")
    PROMO_SID: string;

    @Column("uuid")
    LOYALTY_SID: string;

    @ManyToOne(() => Promotion, promotion => promotion.validation_customer_loyalty, {onDelete: 'CASCADE'} )
    @JoinColumn({name: "PROMO_SID", referencedColumnName: "SID"})
    promotion: Promotion;

    @OneToOne(() => CustomerLoyaltyLevel, loyaltyLevel => loyaltyLevel.promoValidateCustLoyalty, {eager: true})
    @JoinColumn({name: "LOYALTY_SID"})
    loyaltyLevel: CustomerLoyaltyLevel;
    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }

    @BeforeUpdate() 
    updateSID() {
    }
}

export default PromotionValidationCustomerLoyalty;