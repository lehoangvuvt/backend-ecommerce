import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
class RecommendActive extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    SID: number;
    
    @Column('uuid', { nullable: true })
    TYPE_SID: string;

    @Column('uuid', { nullable: true,default:0 })
    ACTIVE: number;

    @Column("varchar", { nullable: false })
    DESCRPITION: string;

}
export default RecommendActive;