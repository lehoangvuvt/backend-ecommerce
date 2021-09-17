import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Permissions from './permission.entity';

@Entity()
class Resources extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  ID: number;

  @Column('nvarchar', { nullable: false, length: 30 })
  DESCRIPTION: string;

  @Column('nvarchar', { nullable: false, length: 30 })
  RESOURCE_PATH: string;

  @OneToMany(() => Permissions, (perm) => perm.resources)
  resPerm: Permissions[];
}

export default Resources;
