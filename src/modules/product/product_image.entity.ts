import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import Product from "./product.entity";

@Entity()

class ProductImage extends BaseEntity {
    @PrimaryColumn("uuid")
    SID: string;

    @Column("uuid")
    PRODUCT_SID: string;

    @Column("uuid", { nullable: true })
    CREATED_BY: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column("uuid", { nullable: true })
    MODIFIED_BY: string;

    @Column("text", { nullable: true })
    PRISM_URL: string;

    @Column('text', { nullable: true })
    IMAGE_NAME: string;

    @Column("int", { width: 1, default: 1 })
    IMAGE_TYPE: number;

    @ManyToOne(() => Product, product => product.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "PRODUCT_SID" })
    product: Product;

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

export default ProductImage;