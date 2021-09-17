import Product from "../product/product.entity";
import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Order from "./order.entity";

@Entity()
class OrderItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('int')
    ORDER_ID: number;

    @Column('uuid')
    SID_PRODUCT: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('nvarchar', {nullable: false, default: ""})
    PRODUCT_NAME: string;

    @Column("numeric", {nullable: false, default: 0})
    PRICE: number;

    @Column("numeric", {nullable: true, default: 0})
    ORIG_PRICE: number;

    @Column("nvarchar", {nullable: false, default: ""})
    PROMO_NAME: string;

    @Column('int', { nullable: false })
    QUANTITY: number;

    @Column("int", {nullable: false, default: 0})
    HAVE_PROMO: number;

    @Column('nvarchar', {nullable: false, default: ""})
    RECOMMENDATION_SID: string;

    @ManyToOne(() => Order, order => order.orderItems)
    @JoinColumn({ name: 'ORDER_ID' })
    order: Order;

    @ManyToOne(() => Product, product => product.orderItems, { eager: true })
    @JoinColumn({ name: "SID_PRODUCT" })
    product: Product;

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }
}

export default OrderItem;