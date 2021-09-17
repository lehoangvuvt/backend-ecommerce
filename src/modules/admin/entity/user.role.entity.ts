import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Users from './users.entity';
import Roles from './role.entity';

@Entity()
class UserRole extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  ID: string;

  @Column('uuid', { nullable: false })
  USER_ID: string;

  @Column('int', { nullable: false })
  ROLE_ID: number;

  @ManyToOne(() => Users, (users) => users.userRole)
  @JoinColumn({ name: 'USER_ID' })
  users: Users;

  @ManyToOne(() => Roles, (roles) => roles.userRole)
  @JoinColumn({ name: 'ROLE_ID' })
  roles: Roles;
}

export default UserRole;
