import { Router } from "express";
import Controller from "interfaces/controllers.interface";
import express from "express";
import GenerateCodeNanoIdService from "../generateCode/generateCode.service";
import EmailSendNodeMailerService from "../mail/sendMailNodeMailer.service";
import { validateDto } from "../middlewares/validation.middleware";
import { Result } from "../utils/utils";
import HashPasswordBcryptService from "../hashPassword/hashPasswordBcrypt.service";
import AuthentificationService from "../authentification/authentification.service";
import { ContactUsDto } from "../contactUs/contactUs.dto";
import UserService from "../users/user.service";
import PostgresUserRepository from "../users/postgresUser.repository";
import PostgresTokenRepository from "../token/postgresToken.repository";
import TokenService from "../token/token.service";

class ContactUsController implements Controller {
  public paths: string = "/api/contact-us";
  public router: Router = express.Router();
  private userService = new UserService(
    new PostgresUserRepository(),
    new GenerateCodeNanoIdService(),
    new HashPasswordBcryptService(),
    new AuthentificationService(
      new HashPasswordBcryptService(),
      new PostgresUserRepository(),
    ),
    new EmailSendNodeMailerService(),
    new TokenService(new PostgresTokenRepository()),
  );

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    /**
     * @swagger
     * /api/contact-us:
     *   post:
     *     tags:
     *       - Contact-Us
     *     summary: contact support
     *     operationId: "contactUs"
     *     requestBody:
     *       description: All informations are required
     *       required: true
     *       content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/ContactUsDto'
     *     responses:
     *       '201':
     *         description: Contact effectively
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TheResponse'
     * components:
     *   schemas:
     *     ContactUsDto:
     *       type: object
     *       properties:
     *         name:
     *          type: string
     *          example: "SOGAN Carmen"
     *         email:
     *          type: string
     *          example: "admin@admin.com"
     *         subject:
     *          type: string
     *          example: "Le sujet du mail"
     *         message:
     *          type: string
     *          example: "Le message en question"
     *     TheResponse:
     *       type: object
     *       properties:
     *         success:
     *                type: boolean
     *                example: true
     *         message:
     *                type: string
     *                example: "Contact"
     *         data:
     *             type: string
     *             nullable: true
     */
    this.router.post(this.paths, validateDto(ContactUsDto), this.contactUs);
  }

  private contactUs = async (req: express.Request, res: express.Response) => {
    try {
      const contactUs: ContactUsDto = req.body;
      await this.userService.contactUs(contactUs);
      res
        .status(200)
        .send(new Result(true, "The contact is successfully", null));
    } catch (error) {}
  };
}

export default ContactUsController;
