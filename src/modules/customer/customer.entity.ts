import CustomerAddress from "./customer_address.entity";
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import RecoveryPassword from "./recovery_password.entity";
import ProductReview from "../product/product_review.entity";
import Product from "../product/product.entity";
import Cart from "./cart.entity";
import Order from "../order/order.entity";
import CustomerWishList from './customer_wishlist.entity'
import { ApiProperty } from "@nestjs/swagger";
import CustomerCoupon from './customer_coupon.entity'

@Entity()
class Customer extends BaseEntity {
    @ApiProperty()
    @PrimaryColumn("uuid")
    SID: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column("nvarchar", { length: 30, nullable: true })
    LAST_NAME: string;

    @Column("nvarchar", { length: 30, nullable: true })
    FIRST_NAME: string;

    @Column("int", { nullable: false, width: 1, default: 0 })
    ACTIVE: number;

    @Column("int", { nullable: true, width: 2 })
    BIRTH_DAY: number;

    @Column("int", { nullable: true, width: 2 })
    BIRTH_MONTH: number;

    @Column("int", { nullable: true, width: 4 })
    BIRTH_YEAR: number;

    @Column("int", { nullable: true, width: 5 })
    CUST_TYPE: number;

    @Column("enum", { enum: ['Male', 'Female'] })
    GENDER: string;

    @Column("numeric", { nullable: true, precision: 16, scale: 4 })
    CREDIT_LIMIT: number;

    @Column("numeric", { nullable: true, precision: 16, scale: 4 })
    CREDIT_USED: number;

    @Column("datetime", { nullable: true })
    FIRST_SALE_DATE: Date;

    @Column("datetime", { nullable: true })
    LAST_SALE_DATE: Date;

    @Column("numeric", { nullable: true, precision: 16, scale: 4 })
    LAST_SALE_AMT: number;

    @Column("bigint", { nullable: true })
    PAYMENT_TERMS_SID: number;

    @Column("nvarchar", { nullable: false, length: 100 })
    EMAIL: string;

    @Column("text")
    HASH_PASSWORD: string;

    @Column("numeric", { nullable: false, default: 0 })
    POINT: number;

    @Column("numeric", { precision: 10, scale: 0, nullable: true })
    TOTAL_TRANSACTIONS: number;

    @Column("numeric", { precision: 10, scale: 0, nullable: true })
    SALE_ITEM_COUNT: number;

    @Column("numeric", { precision: 10, scale: 0, nullable: true })
    RETURN_ITEM_COUNT: number;

    @Column("datetime", { nullable: true })
    LAST_ORDER_DATE: Date;

    @Column("numeric", { precision: 10, scale: 0, nullable: true })
    ORDER_ITEM_COUNT: number;

    @Column('varchar', { nullable: true, length: 11 })
    PHONE: string;

    @OneToMany(() => CustomerAddress, customerAddress => customerAddress.customer, { eager: true, cascade: true })
    addresses: CustomerAddress[];

    @OneToMany(() => CustomerWishList, customerwishList => customerwishList.customer, { eager: true })
    wishlists: CustomerWishList[];


    @OneToMany(() => RecoveryPassword, recoveryPassword => recoveryPassword.customer)
    recoveryLinks: RecoveryPassword[];

    @OneToMany(() => ProductReview, productReview => productReview.createdBy, { eager: true })
    productReviews: ProductReview[];

    @OneToMany(() => Cart, cart => cart.customer, { eager: true })
    carts: Cart[];

    @OneToMany(() => Order, order => order.customer, { eager: true })
    orders: Order[];

    @OneToMany(() => CustomerCoupon, coupon_list => coupon_list.customer, { eager: true })
    coupon_list: CustomerCoupon[];

    @BeforeInsert()
    getSid() {
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default Customer;