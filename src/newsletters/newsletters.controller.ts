import { Router } from "express";
import Controller from "interfaces/controllers.interface";
import express from "express";
import NewslettersService from "./newsletters.service";
import EmailSendNodeMailerService from "../mail/sendMailNodeMailer.service";
import {validateDto} from "../middlewares/validation.middleware";
import { Result } from "../utils/utils";
import HttpException from "../exceptions/HttpException";
import { SendNewlettersDto, SendNewsLetterDto } from "./newsletters.dto";
import UserService from "../users/user.service";
import PostgresUserRepository from "../users/postgresUser.repository";
import GenerateCodeNanoIdService from "../generateCode/generateCode.service";
import HashPasswordBcryptService from "../hashPassword/hashPasswordBcrypt.service";
import authorizeRoles from "../middlewares/role.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import AuthentificationService from "../authentification/authentification.service";

class NewslettersController implements Controller {
  public paths: string = "/api/newsletter";
  public router: Router = express.Router();
  private newslettersService = new NewslettersService(
    new EmailSendNodeMailerService(),
    new UserService(
      new PostgresUserRepository(),
      new GenerateCodeNanoIdService(),
      new HashPasswordBcryptService(),
      new AuthentificationService(
        new HashPasswordBcryptService(),
        new PostgresUserRepository()
      ),
      new EmailSendNodeMailerService()
    )
  );

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    /**
     * @swagger
     * /api/newsletter:
     *   post:
     *     tags:
     *       - Newsletter
     *     summary: Send newsletter
     *     operationId: "sendNewLetters"
     *     requestBody:
     *       description: subject and message are REQUIRED.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateNewslettes'
     *     responses:
     *       '201':
     *         description: project created successfully
     *       '401':
     *         description: Authorization information is missing or invalid.
     * components:
     *   schemas:
     *     CreateNewslettes:
     *       type: object
     *       properties:
     *         subject:
     *           type: string
     *           example: "write a document"
     *         text:
     *           type: string
     *           example: "write a contain of mail"
     */
    this.router.post(
      this.paths,
      authMiddleware,
      authorizeRoles("admin", "editor"),
      validateDto(SendNewsLetterDto),
      this.sendNewLetters
    );

    // /**
    //  * @swagger
    //  * /newsletter/{email}:
    //  *   delete:
    //  *     tags:
    //  *       - newsletter
    //  *     summary: unsubscriber of newsletter
    //  *     operationId: "unsubscriber"
    //  *     parameters:
    //  *       - name: email
    //  *         in: path
    //  *         description: email
    //  *         required: true
    //  *         schema:
    //  *           type: string
    //  *     responses:
    //  *       '200':
    //  *         description: successful operation
    //  *       '400':
    //  *         description: Invalid ID supplied
    //  *       '404':
    //  *         description: Article not found
    //  */
    // this.router.delete(`${this.path}/:email`, this.unsubscriber);
  }

  // private unsubscriber = async (
  //   req: express.Request,
  //   res: express.Response
  // ) => {
  //   try {
  //     const email = req.params.email;
  //     await this.newslettersService.unsubscriber(email);
  //     res.status(204).send(new Result(true, "Email has delete!", null));
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       res.status(error.status).send(new Result(false, error.message, null));
  //     } else {
  //       res.status(500).send(new Result(false, "Internal server error", null));
  //     }
  //   }
  // };

  private sendNewLetters = async (
    req: express.Request,
    res: express.Response
  ) => {
    try {
      const letterInformations: SendNewlettersDto = req.body;
      await this.newslettersService.sendNewsletters(letterInformations);
      res.status(201).send(new Result(true, "New letters are sent!", null));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };
}

export default NewslettersController;
