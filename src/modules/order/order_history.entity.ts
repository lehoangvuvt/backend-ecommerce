import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Order from "./order.entity";

@Entity()
class OrderHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('int', { nullable: false })
    ORDER_ID: number;

    @Column('int', { nullable: false })
    ORDER_STATUS: number;

    @Column('varchar', { length: 100, nullable: true })
    NOTE: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @ManyToOne(() => Order, order => order.historyLines, { cascade: true })
    @JoinColumn({ name: 'ORDER_ID' })
    order: Order;   
}

export default OrderHistory;