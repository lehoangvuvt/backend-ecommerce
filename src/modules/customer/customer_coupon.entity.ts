import { Entity, BaseEntity, BeforeInsert, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import {v4 as uuid} from 'uuid'
import Coupon from './coupon.entity'
import Customer from './customer.entity'

@Entity() 
class CustomerCoupon extends BaseEntity {
    @PrimaryColumn("uuid")
    SID: string;

    @Column("uuid")
    SID_COUPON: string;

    @Column("uuid")
    SID_CUSTOMER: string;

    @ManyToOne(() => Coupon, coupon => coupon.customer_coupon)
    @JoinColumn({name: "SID_COUPON", referencedColumnName: "SID"})
    coupon: Coupon;

    @ManyToOne(() => Customer, customer => customer.coupon_list) 
    @JoinColumn({name: "SID_CUSTOMER", referencedColumnName: "SID"})
    customer: Customer;

    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }
}

export default CustomerCoupon;