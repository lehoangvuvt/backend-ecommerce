import {v4 as uuid} from 'uuid';
import { BaseEntity, BeforeInsert, Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToOne, OneToMany, BeforeUpdate, JoinTable } from "typeorm";
import Promotion from './promotion.entity';
import PromotionValidationFilterElement from './promotion_validation_filter_element.entity';

@Entity()
class PromotionValidationItemRule extends BaseEntity {
    @PrimaryColumn('uuid')
    SID: string;

    @Column("nvarchar", {nullable: true})
    CREATED_BY: string;

    @Column("datetime", {nullable: true})
    CREATED_DATETIME: Date;

    @Column("datetime", {nullable: true})
    MODIFIED_DATETIME: Date;

    @Column("numeric", {nullable: true})
    SUBTOTAL: number;

    @Column("uuid")
    PROMOTION_SID: string;

    @ManyToOne(() => Promotion, promotion => promotion.item_rule)
    @JoinColumn({name: "PROMOTION_SID", referencedColumnName: "SID"})
    promotion: Promotion;

    @OneToMany(() => PromotionValidationFilterElement, filter_element => filter_element.item_rule, {eager: true, cascade: true})
    filter_element: PromotionValidationFilterElement[];

    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }

    @BeforeUpdate()
    updateModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default PromotionValidationItemRule