import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
class StoreEcom extends BaseEntity {
    @PrimaryColumn("nvarchar")
    STORE_CODE: string;
}   

export default StoreEcom;