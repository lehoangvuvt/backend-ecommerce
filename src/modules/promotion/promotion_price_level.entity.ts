import {v4 as uuid} from 'uuid'
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { EnumStringMember, StringLiteral } from '@babel/types';
import Promotion from './promotion.entity'


@Entity()
class PromotionPriceLevel extends BaseEntity {
    @PrimaryColumn('uuid')
    SID: string;

    @Column("nvarchar", {nullable: true})
    CREATED_BY: string;

    @Column("datetime", {nullable: true})
    CREATED_DATETIME: Date;

    @Column("datetime", {nullable: true})
    MODIFIED_DATETIME: Date;

    @Column("uuid")
    PROMOTION_SID: string;

    @ManyToOne(() => Promotion, promotion => promotion.priveLevel)
    @JoinColumn({name: "PROMOTION_SID"})
    promotion: Promotion;

    @BeforeInsert()
    getSID(){
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME= new Date();
    }

    @BeforeUpdate() 
    updateModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default PromotionPriceLevel;