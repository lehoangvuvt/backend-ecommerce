import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import {v4 as uuid} from 'uuid'
import Promotion from "./promotion.entity";
@Entity()
class PromotionPriority extends BaseEntity {

    @PrimaryGeneratedColumn("increment")
    LEVEL: number;

    @Column("uuid")
    PROMOTION_SID: string;

    @OneToOne(() => Promotion, promotion => promotion.priority, {onDelete: "CASCADE"})
    @JoinColumn({name: "PROMOTION_SID", referencedColumnName: "SID"})
    promotion: Promotion;
}

export default PromotionPriority;