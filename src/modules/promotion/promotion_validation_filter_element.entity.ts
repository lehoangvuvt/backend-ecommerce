import {v4 as uuid} from 'uuid'
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import PromotionValidationItemRule from './promotion_validation_item_rule.entity';

@Entity()
class PromotionValidationFilterElement extends BaseEntity {
    @PrimaryColumn('uuid')
    SID: string;

    @Column("nvarchar", {nullable: true})
    CREATED_BY: string;

    @Column("datetime", {nullable: true})
    CREATED_DATETIME: Date;

    @Column("datetime", {nullable: true})
    MODIFIED_DATETIME: Date;

    @Column("varchar")
    FIELD: string;

    @Column("numeric")
    OPERATOR: number;

    @Column("nvarchar")
    OPERAND: string;

    @Column("numeric")
    JOIN_OPERATOR: number;

    @Column("uuid", {nullable: true})
    RULE_SID: string;

    @ManyToOne(() => PromotionValidationItemRule, item_rule => item_rule.filter_element)
    @JoinColumn({name: "RULE_SID", referencedColumnName: "SID"})
    item_rule: PromotionValidationItemRule;

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
}

export default PromotionValidationFilterElement;