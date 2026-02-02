import { LoginDto } from "./login.dto";
import { IHashPasswordService } from "hashPassword/hashPasswordService.interface";
import DataStoredInToken from "token/dataStorageInToken.interface";
import jwt from "jsonwebtoken";
import TokenData from "token/token.interface";
import WrongCredentialsException from "../exceptions/WrongCredentialException";
import AccountIsNotActiveException from "../exceptions/AccountIsNotActiveException";
import IUserRepository from "../users/usersRepository.interface";
import UserNotFoundException from "../exceptions/UserNotFoundException";
import AccessDenied from "../exceptions/AccessDeniedException";

class AuthentificationService {
  constructor(
    private readonly hashPasswordService: IHashPasswordService,
    private readonly repositoryUser: IUserRepository
  ) {}

  public async loginAdmin(loginData: LoginDto) {
    const user = await this.repositoryUser.getUserByEmail(loginData.email);
    if (!user) throw new UserNotFoundException();
    if (user.role == "user") throw new AccessDenied();
    if (user.state == "inactive")
      throw new AccountIsNotActiveException(user.email);
    if (user && user.role != "user") {
      const isPasswordMatching = await this.hashPasswordService.verifyPassword(
        loginData.password,
        user.password
      );
      if (isPasswordMatching) {
        const tokenData = this.createToken(user.id, user.role, user.email);
        return tokenData;
      } else throw new WrongCredentialsException();
    } else throw new WrongCredentialsException();
  }

  private createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; Path=/; Max-Age=${tokenData.expiresIn}; SameSite=None; Secure=true; Partitioned`;
  }

  public createToken(userId: number, role: string, email: string): TokenData {
    const expireIn = 60 * 60;
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      _id: userId,
      _role: role,
      _email: email,
    };
    return {
      expiresIn: expireIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn: expireIn }),
    };
  }
}

export default AuthentificationService;
