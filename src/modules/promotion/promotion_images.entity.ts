import { BaseEntity, BeforeInsert, Column, Entity, PrimaryColumn, ManyToOne, JoinColumn, BeforeUpdate } from "typeorm";
import {v4 as uuid} from 'uuid'
import Promotion from './promotion.entity'


@Entity()
class PromotionImages extends BaseEntity {
    @PrimaryColumn("uuid")
    SID: string;

    @Column("uuid")
    PROMOTION_SID: string;

    @Column("uuid", { nullable: true })
    CREATED_BY: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column("uuid", { nullable: true })
    MODIFIED_BY: string;

    @Column("text", { nullable: true })
    IMAGE_URL: string;

    @Column('text', { nullable: true })
    IMAGE_NAME: string;

    @Column("int", { width: 1, default: 1 })
    IMAGE_TYPE: number;

    @ManyToOne(() => Promotion, product => product.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "PROMOTION_SID", referencedColumnName: 'SID' })
    promotion: Promotion;

    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default PromotionImages;