import {v4 as uuid} from 'uuid'
import { AfterInsert, BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { CONNREFUSED } from 'dns';
import PromotionPriceLevel from './promotion_price_level.entity';
import PromotionValidationItemRule from './promotion_validation_item_rule.entity';
import PromotionPriority from './promotion_priority.entity';
import PromotionValidationCustomerLoyalty from './promotion_validation_customer_loyalty.entity'
import PromotionRewardDiscountItem from './promotion_reward_discount_item.entity'
import PromotionImages from './promotion_images.entity';

@Entity() 
class Promotion extends BaseEntity {
    @PrimaryColumn("uuid") 
    SID: string;

    @Column("nvarchar", {length: 1000, nullable: true})
    DESCRIPTION: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column("nvarchar", {length: 30})
    CREATED_BY: string;

    @Column("nvarchar", {length: 100})
    PROMO_NAME: string;

    @Column("nvarchar", {length: 30})
    DISCOUNT_REASON: string;

    @Column("nvarchar", {length: 30, nullable: true})
    PROMO_GROUP: string;

    @Column("boolean" , {nullable: false, default: true})
    ACTIVE: boolean;

    @Column("numeric", {nullable: false, default: 0})
    COUNT: number;

    @Column("numeric")
    //0: Item
    //1: Transaction
    PROMO_TYPE: number;

    @Column("date", {nullable: true})
    START_DATE: Date;

    @Column("date", {nullable: true})
    END_DATE: Date;

    @Column("numeric", {nullable: true})
    START_TIME: number;

    @Column("numeric", {nullable: true})
    END_TIME: number;

    @Column("boolean")
    USE_STORES: boolean;

    @Column("boolean")
    USE_PRICE_LEVEL: boolean;

    @Column("boolean")
    CAN_BE_COMBINED: boolean;

    @Column("numeric",{nullable: true})
    APPLY_COUNT: number;

    //Apply with other promotion
    @Column("boolean", {nullable: false, default: false})
    CAN_BE_APPLIED: boolean;

    @Column("boolean", {nullable: false, default: false})
    APPLY_WITH_UNAUTHORIZED_CUSTOMER: boolean;
    
    @Column("boolean")
    VALIDATION_USE_ITEMS: boolean;

    @Column("boolean")
    VALIDATION_USE_SUBTOTAL: boolean;

    @Column("numeric", {nullable: true})
    VALIDATION_SUBTOTAL: number;

    @Column("boolean")
    VALIDATION_USE_COUPON: boolean;

    @Column("boolean")
    VALIDATION_USE_CUSTOMERS: boolean;

    @Column("numeric")
    VALIDATION_CUSTOMER_FILTER: number;

    @Column("numeric")
    VALIDATION_CUSTOMER_LOYALTY: number;

    @Column("nvarchar",{nullable:true})
    VALIDATION_CUSTOMER_FILTER_STR: string;

    @Column("boolean")
    REWARD_VALIDATION_ITEMS: boolean;

    @Column("numeric", {nullable: true})
    REWARD_VALIDATION_MODE: number;

    //0: Disc %
    //1: Disc price
    @Column("numeric", {nullable: true})
    REWARD_VALIDATION_DISC_TYPE: number;

    @Column("numeric", {nullable: true})
    REWARD_VALIDATION_DISC_VALUE: number;

    //0: mode Transaction
    //1: mode Item
    @Column("numeric")
    REWARD_MODE: number;

    @Column("nvarchar", {nullable:false, default: ""})
    REWARD_ITEMS_SID: string;

    @Column("boolean")
    REWARD_TRANSACTION: boolean;

    @Column("numeric", {nullable: true})
    REWARD_TRANSACTION_MODE: number;

    @Column("numeric", {nullable: false, default: 0})
    REWARD_TRANSACTION_DISC_TYPE: number;

    @Column("numeric", {nullable: false, default: 0})
    REWARD_TRANSACTION_DISC_VALUE: number;
    
    @OneToOne(() => PromotionPriority, priority => priority.promotion, {eager: true, cascade: true, onDelete: "CASCADE",onUpdate: 'CASCADE'})
    priority: PromotionPriority;

    @OneToMany(() => PromotionPriceLevel, priceLevel => priceLevel.promotion, {eager: true, cascade: true})
    priveLevel: PromotionPriceLevel[];

    @OneToMany(() => PromotionValidationItemRule, item_rule => item_rule.promotion, {eager: true, cascade: true})
    item_rule: PromotionValidationItemRule[];

    @OneToMany(() => PromotionValidationCustomerLoyalty, validation_customer_loyalty => validation_customer_loyalty.promotion, {eager: true, cascade: true, onDelete: "CASCADE", onUpdate: 'CASCADE'})
    validation_customer_loyalty: PromotionValidationCustomerLoyalty[];

    @OneToMany(() => PromotionRewardDiscountItem, reward_discount_item => reward_discount_item.promotion, {cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    reward_discount_item: PromotionRewardDiscountItem[];

    @OneToMany(() => PromotionImages, images => images.promotion, {eager: true, cascade: true, onDelete: "CASCADE",onUpdate: 'CASCADE'})
    images: PromotionImages[];
    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    updateModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }

    // @AfterInsert() 
    // createPriority() {
    //     this.priority = new PromotionPriority();
    // }
}

export default Promotion;