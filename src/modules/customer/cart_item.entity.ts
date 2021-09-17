import Product from "../product/product.entity";
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Cart from "./cart.entity";

@Entity()
class CartItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("uuid")
    CART_SID: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column("uuid", { name: 'SID_PRODUCT' })
    SID_PRODUCT: string;

    @Column("int")
    QUANTITY: number;

    @ManyToOne(() => Cart, cart => cart.items)
    @JoinColumn({ name: 'CART_SID' })
    cart: Cart;

    @ManyToOne(() => Product, product => product.cartItems, { eager: true })
    @JoinColumn({ name: "SID_PRODUCT" })
    product: Product;

    @BeforeInsert()
    getCreatedDate() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDate() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default CartItem;