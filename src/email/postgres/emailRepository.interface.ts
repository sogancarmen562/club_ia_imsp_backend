import { UserTypeParamDto } from "../email.dto";
import Email from "../email.interface";

interface IEmailRepository {
  addEmail(email: UserTypeParamDto): Promise<Email>;
  deleteEmail(email: string): Promise<void>;
  isEmailExist(email: string): Promise<boolean>;
  getAllEmail(): Promise<Email[] | []>;
  getEmail(email: string): Promise<Email>;
  // getUser(): Promise<Users | null>;
}

export default IEmailRepository;
