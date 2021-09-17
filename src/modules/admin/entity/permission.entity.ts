import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Resources from './resource.entity';
import Roles from './role.entity';

@Entity()
class Permissions extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  ID: number;

  @Column('int', { nullable: false })
  ROLE_ID: number;

  @Column('int', { nullable: false })
  RESOURCE_ID: number;

  @Column('varchar', { nullable: false, length: 20 })
  RIGHT: string;

  @ManyToOne(() => Roles, (roles) => roles.userRole)
  @JoinColumn({ name: 'ROLE_ID' })
  roles: Roles;

  @ManyToOne(() => Resources, (resources) => resources.resPerm, { eager: true })
  @JoinColumn({ name: 'RESOURCE_ID' })
  resources: Resources;
}

export default Permissions;
