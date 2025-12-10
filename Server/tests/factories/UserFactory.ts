import { Factory } from 'fishery';
import { User } from '../../src/entities/User';
import { AppDataSource } from '../../src/config/database';
import { v4 as uuidv4 } from 'uuid';
import { Role, RoleType } from '../../src/entities/Role';

export const UserFactory = Factory.define<User>(({ sequence, onCreate }) => {
  onCreate(async (user) => {
    return await AppDataSource.getRepository(User).save(user);
  });

  const user = new User();
  user.id = uuidv4();
  user.firstName = `TestUser${sequence}`;
  user.lastName = 'User';
  user.email = `user${sequence}@example.com`;
  user.password =
    '$2b$10$EpIxT98hP7vsl96xGjhESeASjE0LB5u.maT.1eSuWkY2guwS9.1.m'; // hashed 'password123'
  user.isActive = true;
  user.isAdult = true;
  user.hasAcceptedTerms = true;
  user.createdAt = new Date();
  user.updatedAt = new Date();

  // Default role (Player)
  const role = new Role();
  role.name = RoleType.PLAYER;
  user.role = role;

  return user;
});
