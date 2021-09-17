import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';
import UserRole from './user.role.entity';

@Entity()
class Users extends BaseEntity {
  @ApiProperty()
  @PrimaryColumn('uuid')
  SID: string;

  @Column('datetime', { nullable: false })
  CREATED_DATETIME: Date;

  @Column('datetime', { nullable: true })
  MODIFIED_DATETIME: Date;

  @Column('nvarchar', { length: 30, nullable: true })
  FIRST_NAME: string;

  @Column('nvarchar', { length: 30, nullable: true })
  LAST_NAME: string;

  @Column('int', { nullable: false, width: 1, default: 0 })
  ACTIVE: number;

  @Column('enum', { enum: ['Male', 'Female'] })
  GENDER: string;

  @Column('nvarchar', { nullable: false, length: 100 })
  EMAIL: string;

  @Column('text')
  HASH_PASSWORD: string;

  @OneToMany(
    () => UserRole,
    (userRole) => userRole.users,
    { eager: true },
  )
  userRole: UserRole[];

  @BeforeInsert()
  getSid() {
    this.SID = uuid();
  }

  @BeforeInsert()
  getCreatedDateTime() {
    this.CREATED_DATETIME = new Date();
  }

  @BeforeUpdate()
  getModifiedDateTime() {
    this.MODIFIED_DATETIME = new Date();
  }
}

export default Users;
