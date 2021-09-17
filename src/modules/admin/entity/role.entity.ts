import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Permissions from './permission.entity';
import UserRole from './user.role.entity';

@Entity()
class Roles extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  ID: number;

  @Column('nvarchar', { nullable: false, length: 30 })
  ROLE_NAME: string;

  @Column('datetime', { nullable: false })
  CREATED_DATETIME: Date;

  @Column('datetime', { nullable: true })
  MODIFIED_DATETIME: Date;

  @Column('int', { nullable: false, width: 1, default: 0 })
  ACTIVE: number;

  @OneToMany(() => UserRole, (userRole) => userRole.roles, { eager: true })
  userRole: UserRole[];

  @OneToMany(() => Permissions, (perm) => perm.roles, { eager: true })
  rolePerm: Permissions[];

  @BeforeInsert()
  getCreatedDateTime() {
    this.CREATED_DATETIME = new Date();
  }

  @BeforeUpdate()
  getModifiedDateTime() {
    this.MODIFIED_DATETIME = new Date();
  }
}

export default Roles;
