import IUserRepository from "./usersRepository.interface";
import EmailAlreadyExistException from "../exceptions/EmailAlreadyExistException";
import { Users } from "./user.interface";
import { IHashPasswordService } from "hashPassword/hashPasswordService.interface";
import { IGenerateCode } from "generateCode/generateCode.interface";
import Email from "email/email.interface";
import UserNotFoundException from "../exceptions/UserNotFoundException";
import { ChangePasswordDto } from "./user.dto";
import AuthentificationService from "../authentification/authentification.service";
import ISendMail from "../mail/sendMailPort.interface";
import { decodedToken } from "../middlewares/auth.middleware";
import AccessDenied from "../exceptions/AccessDeniedException";
import { ContactUsDto } from "../contactUs/contactUs.dto";
import HttpException from "../exceptions/HttpException";
import TokenService from "token/token.service";
import TokenNotFoundException from "../exceptions/tokenNotFoundException";
import TokenAlreadyUsedException from "../exceptions/TokenAlreadyUsedException";

class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly generateCodeService: IGenerateCode,
    private readonly hashPasswordService: IHashPasswordService,
    private readonly authentificationService: AuthentificationService,
    private readonly sendMailService: ISendMail,
    private readonly tokenService: TokenService,
  ) {}

  public async contactUs(contactInfo: ContactUsDto): Promise<void> {
    await this.sendMailService.contactUs(
      contactInfo.email,
      contactInfo.name,
      contactInfo.subject,
      contactInfo.message,
    );
  }

  public async createEditor(email: string): Promise<string> {
    await this.ConflictEmail(email);
    const codeGenerated = this.generateCodeService.getUniqueCodeGenerate();
    const codeGeneratedHashed =
      await this.hashPasswordService.hashPassword(codeGenerated);
    const user = await this.userRepository.createUser(
      email,
      "editor",
      codeGeneratedHashed,
      "inactive",
    );
    const token = this.authentificationService.createToken(
      user.id,
      user.role,
      user.email,
      true,
    );
    await this.sendMailService.sendMailTo(
      user.email,
      "Activation de compte",
      `${process.env.URL.split(",")[1]}/reset-password?token=${token.token}`,
      "Activer votre compte",
      `Votre compte vient d'être créer, cliquer sur bouton pour l'activer.`,
    );
    await this.tokenService.store(token.token);
    return token.token;
  }

  public async receiveEmailWhenForgotPassword(email: string): Promise<string> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new UserNotFoundException();
    if (user.role == "user") throw new AccessDenied();
    const token = this.authentificationService.createToken(
      user.id,
      user.role,
      user.email,
      false,
    );
    await this.sendMailService.sendMailTo(
      user.email,
      "Mis à jour de mot de passe",
      `${process.env.URL.split(",")[1]}/reset-password?token=${token.token}`,
      "Changer mon mot de passe",
      `Cliquer sur ce bouton pour changer votre mot de passe.`,
    );
    await this.tokenService.store(token.token);
    return token.token;
  }

  public async getUserByEmail(email: string) {
    return await this.userRepository.getUserByEmail(email);
  }

  public async activeAccount(newPassword: ChangePasswordDto): Promise<Users> {
    const tokenDecoded = decodedToken(newPassword.token);
    const user = await this.getUserById(Number(tokenDecoded?._id));
    if (user.state == "active")
      throw new HttpException(400, "Your account is already active");
    if (user.role == "user") throw new AccessDenied();
    const passwordHashed = await this.hashPasswordService.hashPassword(
      newPassword.password,
    );
    const userActive = await this.userRepository.activeAccount(
      user.id,
      passwordHashed,
    );
    return userActive;
  }

  public async updatePassword(newPassword: ChangePasswordDto): Promise<number> {
    const isTokenExisting = await this.tokenService.getStatus(
      newPassword.token,
    );
    if (isTokenExisting == null) throw new TokenNotFoundException();
    if (isTokenExisting) throw new TokenAlreadyUsedException();
    const tokenDecoded = decodedToken(newPassword.token);
    const user = await this.getUserById(Number(tokenDecoded?._id));
    if (user.state == "inactive")
      throw new HttpException(400, "Your account isn't active");
    if (user.role == "user") throw new AccessDenied();
    const passwordHashed = await this.hashPasswordService.hashPassword(
      newPassword.password,
    );
    await this.userRepository.updatePassword(user.id, passwordHashed);
    await this.tokenService.toggleStatus(newPassword.token);
    return user.id;
  }

  public async addEmail(email: string): Promise<Users> {
    await this.ConflictEmail(email);
    return this.userRepository.createUser(email, "user");
  }

  public async getAllEmail(): Promise<Email[] | []> {
    return await this.userRepository.getAllEmail();
  }

  public async deleteUser(userId: number): Promise<void> {
    await this.UserNotFound(userId);
    await this.userRepository.deleteUser(userId);
  }

  public async getAllUserEditor(): Promise<Users[] | []> {
    return await this.userRepository.getAllUserEditor();
  }

  public async getUserById(userId: number) {
    return await this.UserNotFound(userId);
  }

  private async UserNotFound(userId: number) {
    const userFound = await this.userRepository.getUserById(userId);
    if (!userFound) throw new UserNotFoundException();
    return userFound;
  }

  public async ConflictEmail(email: string) {
    const emailUser = await this.userRepository.getUserByEmail(email);
    if (emailUser) throw new EmailAlreadyExistException(email);
    return emailUser;
  }
}

export default UserService;
