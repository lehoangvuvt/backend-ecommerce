import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
class SearchTerm extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Index({ fulltext: true })
    @Column("nvarchar", { length: 100, nullable: true, })
    SEARCH_TERM: string;

    @Column('int', { nullable: false, default: 1 })
    COUNT: number;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column('int', { nullable: false, default: 0 })
    TOTAL_RECORD: number;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default SearchTerm;