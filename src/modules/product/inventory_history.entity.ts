import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Product from "./product.entity";

@Entity()
class InventoryHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('uuid')
    PRODUCT_SID: string;

    @Column('int')
    QTY: number;

    @Column('int', { default: 0 })
    ORIGINAL_QTY: number;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('uuid', { nullable: true })
    CREATED_BY: string;

    @ManyToOne(() => Product, product => product.inventoryHistories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'PRODUCT_SID' })
    product: Product;

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }
}

export default InventoryHistory;