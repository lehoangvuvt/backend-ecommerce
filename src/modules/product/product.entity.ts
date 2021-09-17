import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import ProductInformation from "./product_information.entity";
import ProductImage from "./product_image.entity";
import ProductAttributeValue from "./product_attribute_value.entity";
import OrderItem from "../order/order_item.entity";
import CartItem from "../customer/cart_item.entity";
import InventoryHistory from "./inventory_history.entity";
import PromotionRewardDiscountItem from "../promotion/promotion_reward_discount_item.entity";

@Entity()
class Product extends BaseEntity {
    @PrimaryColumn('uuid')
    SID: string;

    @Column('uuid', { nullable: false })
    SID_PRODUCT_INFORMATION: string;

    @Column('int')
    QTY: number;

    @Column('varchar', { nullable: true, length: 8 })
    UPC: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @ManyToOne(() => ProductInformation, productInformation => productInformation.products, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'SID_PRODUCT_INFORMATION' })
    productInformation: ProductInformation;

    @OneToMany(() => ProductImage, productImage => productImage.product, { eager: true, cascade: true })
    images: ProductImage[];

    @OneToMany(() => ProductAttributeValue, productAttribute => productAttribute.product, { cascade: true })
    productAttributeValues: ProductAttributeValue[];

    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    orderItems: OrderItem[];

    @OneToMany(() => CartItem, cartItem => cartItem.product)
    cartItems: CartItem[];

    @OneToMany(() => InventoryHistory, inventoryHistory => inventoryHistory.product, { eager: true, cascade: true })
    inventoryHistories: InventoryHistory[];

    @OneToMany(() => PromotionRewardDiscountItem, discount_promotion => discount_promotion.product, { eager: true })
    discount_promotion: PromotionRewardDiscountItem[];

    @BeforeInsert()
    getSid() {
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDatetime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default Product;