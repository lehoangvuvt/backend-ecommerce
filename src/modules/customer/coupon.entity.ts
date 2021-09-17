import { Entity, BaseEntity, PrimaryColumn, BeforeInsert, Column, ManyToOne, JoinColumn, OneToMany, Unique, OneToOne } from "typeorm";
import {v4 as uuid} from 'uuid' 
import Order from "../order/order.entity";
import Customer from './customer.entity'
import CustomerCoupon from './customer_coupon.entity'

@Entity()
@Unique(["COUPON_NAME"])
class Coupon extends BaseEntity {
    @PrimaryColumn("uuid")
    SID: string;

    @Column("nvarchar", {nullable: false})
    COUPON_NAME: string;

    @Column("nvarchar", {nullable: false, default: ""})
    DESCRIPTION: string;

    @Column("date", {nullable: true}) 
    START_DATE: Date;

    @Column("date", {nullable: true})
    END_DATE: Date;

    @Column("numeric", {nullable: true})
    START_TIME: number;

    @Column("numeric", {nullable: true})
    END_TIME: number;

    @Column("numeric", {nullable: true, default: 0})  
    APPLY_COUNT: number;

    @Column("boolean", {nullable: false, default: true})
    ACTIVE: boolean;

    @Column("boolean", {nullable: false, default: false})
    VALIDATION_USE_SUBTOTAL: boolean;

    @Column("numeric", {nullable: false, default: 0})
    VALIDATION_SUBTOTAL: number;

    @Column("numeric", {nullable: true})
    REWARD_MODE: number;

    @Column("numeric", {nullable: true})
    REWARD_DISCOUNT_TYPE: number;

    @Column("numeric", {nullable: true})
    REWARD_DISCOUNT_VALUE: number;

    @OneToMany(() => CustomerCoupon, customer_coupon => customer_coupon.coupon, {eager: true, cascade: true})
    customer_coupon: CustomerCoupon[];

    // @OneToMany(() => Order, order => order.coupon)
    // order: Order[];

    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }
}

export default Coupon;