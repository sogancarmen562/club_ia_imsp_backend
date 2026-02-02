import { Users } from "./user.interface";
import Email from "email/email.interface";

interface IUserRepository {
  createUser(
    email: string,
    role: string,
    passwordHashed?: string,
    state?: string,
  ): Promise<Users>;
  deleteUser(userId: number): Promise<void>;
  getAllUserEditor(): Promise<Users[] | []>;
  activeAccount(userId: number, password: string): Promise<Users>;
  updatePassword(userId: number, password: string): Promise<number>;
  getUserByEmail(email: string): Promise<Users>;
  getUserById(userId: number): Promise<Users>;
  getAllEmail(): Promise<Email[] | []>;
}

export default IUserRepository;
