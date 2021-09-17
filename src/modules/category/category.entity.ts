import ProductCategory from "../product/product_category.entity";
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { v4 as uuid } from 'uuid';

@Entity()
export default class Category extends BaseEntity {
    @PrimaryColumn("uuid")
    SID: string;

    @Column("uuid", { nullable: true })
    CREATED_BY: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column("uuid", { nullable: true })
    MODIFIED_BY: string;

    @Column('nvarchar', { length: 40, nullable: false, unique: true })
    CATEGORY_CODE: string;

    @Column("nvarchar", { length: 60, nullable: false, unique: true })
    CATEGORY_NAME: string;

    @Column("nvarchar", { length: 100, nullable: false })
    SHORT_DESCRIPTION: string;

    @Column("text", { nullable: false })
    LONG_DESCRIPTION: string;

    @OneToMany(() => ProductCategory, productCategory => productCategory.category, { cascade: true })
    productConnections: ProductCategory[];

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