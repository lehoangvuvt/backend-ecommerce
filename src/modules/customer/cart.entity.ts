import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import CartItem from "./cart_item.entity";
import Customer from "./customer.entity";

@Entity()
class Cart extends BaseEntity {
    @PrimaryColumn("uuid")
    SID: string;

    @Column('uuid', { nullable: true })
    SID_CUSTOMER: string;

    @Column('uuid', { nullable: true })
    SESSION_ID: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("int", { width: 1, default: 1 })
    STATUS: number;

    @Column("nvarchar", { length: 30, nullable: true })
    IP_ADDRESS: string;

    @ManyToOne(() => Customer, customer => customer.carts)
    @JoinColumn({ name: "SID_CUSTOMER" })
    customer: Customer;

    @OneToMany(() => CartItem, cartItem => cartItem.cart, { eager: true })
    items: CartItem[];

    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDate() {
        this.CREATED_DATETIME = new Date();
    }
}

export default Cart;