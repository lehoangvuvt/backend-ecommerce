import {Entity, BaseEntity, PrimaryGeneratedColumn, PrimaryColumn, BeforeInsert, Column, ManyToOne, JoinColumn, OneToOne, BeforeUpdate } from "typeorm";
import {v4 as uuid} from 'uuid';
import Promotion from './promotion.entity'
import Product from '../product/product.entity'

@Entity()
class PromotionRewardDiscountItem extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    SID: string;

    @Column("uuid", {nullable: false})
    SID_PRODUCT: string;

    @Column("uuid", {nullable: false})
    SID_PROMOTION: string;

    @Column("float", {nullable: false })
    DISC_VALUE: number;

    @ManyToOne(() => Promotion, promotion => promotion.reward_discount_item, {eager: true, onDelete: "CASCADE"})
    @JoinColumn({name: "SID_PROMOTION", referencedColumnName: "SID"})
    promotion: Promotion;

    @ManyToOne(() => Product, product => product.discount_promotion)
    @JoinColumn({name: "SID_PRODUCT", referencedColumnName: "SID" }) 
    product: Product;

    @BeforeInsert()
    getSID() {
        console.log('2');
        this.SID = uuid();
    }

    @BeforeUpdate() 
    updateSID() {
        console.log('abd')
    }

}

export default PromotionRewardDiscountItem;