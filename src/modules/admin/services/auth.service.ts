import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync, compareSync } from 'bcrypt';
import { Repository } from 'typeorm';
import EditRoleDTO from '../dto/edit_role.dto';
import UserRolesDTO from '../dto/user_role.dto';
import LoginDTO from '../dto/login.dto';
import RegisterDTO from '../dto/register.dto';
import RoleDTO from '../dto/role.dto';
import Permissions from '../entity/permission.entity';
import Resources from '../entity/resource.entity';
import Roles from '../entity/role.entity';
import UserRole from '../entity/user.role.entity';
import Users from '../entity/users.entity';

@Injectable()
export default class AuthService {
  constructor(
    @InjectRepository(Users) private usersRepo: Repository<Users>,
    @InjectRepository(Roles) private rolesRepo: Repository<Roles>,
    @InjectRepository(Resources) private resourcesRepo: Repository<Resources>,
    @InjectRepository(Permissions) private permRepo: Repository<Permissions>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
  ) {}

  async register(registerDTO: RegisterDTO) {
    const user = await this.usersRepo.findOne({
      where: { EMAIL: registerDTO.EMAIL },
    });
    if (user) return { error: 'Email existed' };
    const hash_password = hashSync(registerDTO.PASSWORD, 10);
    const newUser = this.usersRepo.create({
      EMAIL: registerDTO.EMAIL,
      FIRST_NAME: registerDTO.FIRST_NAME,
      LAST_NAME: registerDTO.LAST_NAME,
      HASH_PASSWORD: hash_password,
      GENDER: registerDTO.GENDER,
      ACTIVE: 1,
    });
    await newUser.save();
    newUser.HASH_PASSWORD = '';
    return {
      user: newUser,
    };
  }

  async login(loginDTO: LoginDTO) {
    const user = await this.usersRepo.findOne({
      where: { EMAIL: loginDTO.EMAIL, ACTIVE: 1 },
    });
    if (!user) return { error: 'Incorrect email' };
    const verify = compareSync(loginDTO.PASSWORD, user.HASH_PASSWORD);
    if (!verify) return { error: 'Incorrect password' };
    let user_info = user;
    delete user_info.HASH_PASSWORD;
    return {
      user_info,
    };
  }

  async createRole(roleDTO: RoleDTO) {
    const role = await this.rolesRepo.findOne({
      where: { ROLE_NAME: roleDTO.ROLE_NAME, ACTIVE: 1 },
    });
    if (role) return { error: 'Exited role' };
    const newRole = this.rolesRepo.create({
      ROLE_NAME: roleDTO.ROLE_NAME,
      ACTIVE: 1,
    });
    await newRole.save();
    return {
      newRole,
    };
  }

  async getAllRole() {
    const roles = await this.rolesRepo.find({ where: { ACTIVE: 1 } });
    let roles_info = roles;
    roles_info.map((item) => {
      delete item.userRole;
      delete item.rolePerm;
    });
    return {
      roles,
    };
  }

  async getRolePermissonsByID(roleID) {
    const role = await this.rolesRepo.findOne({
      where: { ID: roleID },
    });
    if (!role) return { error: 'Role not existed' };
    let role_info = role;
    delete role_info.userRole;
    delete role_info.ACTIVE;
    delete role_info.CREATED_DATETIME;
    delete role_info.MODIFIED_DATETIME;
    role_info.rolePerm.map((item, index) => {
      role_info.rolePerm[index]['PATH'] = item.resources.RESOURCE_PATH;
      let rights = item.RIGHT.split(',');
      role_info.rolePerm[index]['RIGHTS'] = rights;
      delete item.resources;
      delete item.ROLE_ID;
      delete item.RESOURCE_ID;
      delete item.ID;
      delete item.RIGHT;
    });
    return {
      role_info,
    };
  }

  async getRolesPerm() {
    const roles = await this.rolesRepo.query(`
    SELECT mydb.roles.ID as ROLE_ID, mydb.roles.ROLE_NAME, mydb.resources.ID as RESOUCRE_ID, mydb.resources.DESCRIPTION as RESOURCE, mydb.permissions.RIGHT
    FROM mydb.roles 
    inner join mydb.permissions 
    inner join mydb.resources
    where mydb.roles.ID = mydb.permissions.ROLE_ID 
    and mydb.permissions.RESOURCE_ID = mydb.resources.ID
    and mydb.roles.ACTIVE = 1;`);
    return { roles };
  }

  async getRolePermByPath(path) {
    const perm = await this.rolesRepo.query(`
    SELECT mydb.roles.ID, mydb.roles.ROLE_NAME, mydb.resources.RESOURCE_PATH, mydb.permissions.RIGHT
    FROM mydb.roles 
    inner join mydb.permissions 
    inner join mydb.resources
    where mydb.roles.ID = mydb.permissions.ROLE_ID 
    and mydb.permissions.RESOURCE_ID = mydb.resources.ID 
    and mydb.roles.ACTIVE = 1 
    and mydb.resources.RESOURCE_PATH = "${path}"; `);
    return { perm };
  }

  async createRolePermission(dto: EditRoleDTO) {
    const perm = await this.permRepo.findOne({
      where: { ROLE_ID: dto.ROLE_ID, RESOURCE_ID: dto.RESOUCRE_ID },
    });
    if (perm)
      return { error: 'This role already have access to this resource!' };
    const created = await this.permRepo.save({
      ROLE_ID: dto.ROLE_ID,
      RESOURCE_ID: dto.RESOUCRE_ID,
      RIGHT: dto.RIGHT,
    });
    return { created };
  }

  async editRolePermission(dto: EditRoleDTO) {
    const perm = await this.permRepo.findOne({
      where: { ROLE_ID: dto.ROLE_ID, RESOURCE_ID: dto.RESOUCRE_ID },
    });
    const updated = await this.permRepo.save({
      ID: perm.ID,
      ROLE_ID: dto.ROLE_ID,
      RESOURCE_ID: dto.RESOUCRE_ID,
      RIGHT: dto.RIGHT,
    });
    return { updated };
  }

  //User

  async getUserByID(userID) {
    const user = await this.usersRepo.findOne({
      where: { SID: userID, ACTIVE: 1 },
    });
    if (!user) return { error: 'User not exist!' };
    let user_info = user;
    delete user_info.HASH_PASSWORD;
    return {
      user_info,
    };
  }

  async getAllUsers() {
    const users = await this.usersRepo
      .createQueryBuilder('users')
      .select([
        'users.SID',
        'users.FIRST_NAME',
        'users.LAST_NAME',
        'users.GENDER',
        'users.EMAIL',
        'users.ACTIVE',
      ])
      .leftJoinAndSelect('users.userRole', 'userRole')
      .leftJoinAndSelect('userRole.roles', 'roles')
      .getMany();

    let users_info = users;
    users_info.map((user) => {
      user.userRole.map((role, index) => {
        user.userRole[index]['ROLE'] = role.roles.ROLE_NAME;
        delete role.roles;
      });
    });
    return {
      users_info,
    };
  }

  async createUserRoles(dto: UserRolesDTO) {
    if (dto.DELETE_IDS.length > 0) {
      dto.DELETE_IDS.map(async (item) => {
        await this.userRoleRepo.delete({
          USER_ID: dto.USER_ID,
          ROLE_ID: item,
        });
      });
    }
    const loop = dto.ROLE_IDS.map(async (item) => {
      const userRole = await this.userRoleRepo.findOne({
        where: { USER_ID: dto.USER_ID, ROLE_ID: item },
      });
      if (!userRole) {
        this.userRoleRepo.save({
          USER_ID: dto.USER_ID,
          ROLE_ID: item,
        });
      }
    });

    return { loop };
  }

  //Resource
  async getAllResources() {
    const resources = await this.resourcesRepo.find();
    return {
      resources,
    };
  }
}
