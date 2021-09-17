import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class PrismCrawlHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
    ROW_NO: number;

    @Column('varchar', { length: 20, nullable: false, unique: true })
    TABLE_NAME: string;

    @Column('datetime', { nullable: false })
    LAST_CRAWL_DATETIME: Date;
}