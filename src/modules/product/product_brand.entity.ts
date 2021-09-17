import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import ProductInformation from "./product_information.entity";

@Entity()
class ProductBrand extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    SID: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('varchar', { length: 100, nullable: false, unique: true })
    NAME: string;

    @OneToMany(() => ProductInformation, productInformation => productInformation.productBrand)
    products: ProductInformation[];

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

export default ProductBrand;