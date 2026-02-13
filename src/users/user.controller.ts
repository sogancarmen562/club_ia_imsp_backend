import { Router } from "express";
import Controller from "interfaces/controllers.interface";
import express from "express";
import GenerateCodeNanoIdService from "../generateCode/generateCode.service";
import EmailSendNodeMailerService from "../mail/sendMailNodeMailer.service";
import {
  validateDto,
  validateParams,
} from "../middlewares/validation.middleware";
import { Result } from "../utils/utils";
import HttpException from "../exceptions/HttpException";
import UserService from "./user.service";
import PostgresUserRepository from "./postgresUser.repository";
import HashPasswordBcryptService from "../hashPassword/hashPasswordBcrypt.service";
import { ChangePasswordDto } from "./user.dto";
import { authMiddleware } from "../middlewares/auth.middleware";
import authorizeRoles from "../middlewares/role.middleware";
import AuthentificationService from "../authentification/authentification.service";
import { ContactUsDto } from "../contactUs/contactUs.dto";
import { UserTypeParamDto } from "../email/email.dto";
import PostgresTokenRepository from "../token/postgresToken.repository";
import TokenService from "../token/token.service";

class UserController implements Controller {
  public paths: string = "/api/user";
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
     * /api/user/subscriber/{email}:
     *   post:
     *     tags:
     *       - Users
     *     summary: add a subscriber
     *     operationId: "addEmail"
     *     parameters:
     *       - name: email
     *         in: path
     *         description: L'email du subscriber
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '201':
     *         description: successful operation
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AddEmail'
     * components:
     *   schemas:
     *      AddEmail:
     *        type: object
     *        properties:
     *          success:
     *                 type: boolean
     *                 example: true
     *          message:
     *                 type: string
     *                 example: "Successful"
     *          data:
     *              type: string
     *              nullable: true
     */
    this.router.post(
      `${this.paths}/subscriber/:email`,
      validateParams(UserTypeParamDto),
      this.addEmail,
    );

    /**
     * @swagger
     * /api/user/subscriber:
     *   get:
     *     tags:
     *       - Users
     *     summary: Get all subscriber(ADMIN, EDITOR)
     *     operationId: "allEmail"
     *     responses:
     *       '200':
     *         description: Successful operations
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/GetAllEmail'
     * components:
     *   schemas:
     *     GetAllEmail:
     *      type: object
     *      properties:
     *        success:
     *               type: string
     *               example: true
     *        message:
     *               type: string
     *               example: "All email"
     *        data:
     *            type: array
     *            items:
     *             type: object
     *             properties:
     *                email:
     *                     type: string
     *                     example: "ninja@gmail.com"
     *                joinedAt:
     *                     type: Date
     *                     example: "20/20/2020"
     */
    this.router.get(
      `${this.paths}/subscriber`,
      authMiddleware,
      authorizeRoles("admin", "editor"),
      this.allEmail,
    );

    /**
     * @swagger
     * /api/user/editor:
     *   get:
     *     tags:
     *       - Users
     *     summary: Get all editors
     *     operationId: "getAllEditor"
     *     responses:
     *       '200':
     *         description: Successful operations
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/GetAllUsers'
     * components:
     *   schemas:
     *     GetAllUsers:
     *      type: object
     *      properties:
     *        success:
     *               type: boolean
     *               example: true
     *        message:
     *               type: string
     *               example: 'All editor'
     *        data:
     *            type: array
     *            items:
     *              type: object
     *              properties:
     *                 id:
     *                   type: number
     *                   example: 1
     *                 email:
     *                   type: string
     *                   example: "admin@admin.com"
     *                 joinedAt:
     *                   type: Date
     *                   example: "20/20/2020"
     *                 role:
     *                   type: string
     *                   example: "editor"
     *                 state:
     *                   type: string
     *                   example: "active"
     */
    this.router.get(
      `${this.paths}/editor`,
      authMiddleware,
      authorizeRoles("admin"),
      this.getAllEditor,
    );

    /**
     * @swagger
     * /api/user/editor/{email}:
     *   post:
     *     tags:
     *       - Users
     *     summary: add editor (ADMIN)
     *     operationId: "createEditor"
     *     parameters:
     *       - name: email
     *         in: path
     *         description: L'email de l'éditeur
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '201':
     *         description: Send email to editor when your account is created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AddEditor'
     * components:
     *   schemas:
     *     AddEditor:
     *       type: object
     *       properties:
     *         success:
     *                type: boolean
     *                example: true
     *         message:
     *                type: string
     *                example: 'Url is sent'
     *         data:
     *             type: string
     *             example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    this.router.post(
      `${this.paths}/editor/:email`,
      authMiddleware,
      authorizeRoles("admin"),
      validateParams(UserTypeParamDto),
      this.createEditor,
    );

    /**
     * @swagger
     * /api/user/active:
     *   put:
     *     tags:
     *       - Users
     *     summary: active account (EDITOR)
     *     operationId: "activeAccount"
     *     requestBody:
     *       description: token and password are REQUIRED
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/ActiveAccount"
     *     responses:
     *        '201':
     *          description: Active editor account
     *          content:
     *            application/json:
     *              schema:
     *                $ref: '#/components/schemas/ActiveEditor'
     * components:
     *   schemas:
     *     ActiveAccount:
     *       type: object
     *       properties:
     *         token:
     *           type: string
     *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *         password:
     *            type: string
     *            example: "password"
     *     ActiveEditor:
     *       type: object
     *       properties:
     *         success:
     *                type: boolean
     *                example: true
     *         message:
     *                type: string
     *                example: 'Your account is active'
     *         data:
     *             type: string
     *             nullable: true
     */
    this.router.put(
      `${this.paths}/active`,
      validateDto(ChangePasswordDto),
      this.activeAccount,
    );

    /**
     * @swagger
     * /api/user/password:
     *   put:
     *     tags:
     *       - Users
     *     summary: Update password (Account active)
     *     operationId: "updatePassword"
     *     requestBody:
     *       description: token and password are REQUIRED
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ActiveAccount'
     *     responses:
     *        '201':
     *          description: Update password
     *          content:
     *            application/json:
     *              schema:
     *                $ref: '#/components/schemas/ChangePassword'
     * components:
     *   schemas:
     *     ChangePassword:
     *       type: object
     *       properties:
     *         success:
     *                type: boolean
     *                example: true
     *         message:
     *                type: string
     *                example: "Password changed"
     *         data:
     *             type: string
     *             nullable: true
     */
    this.router.put(
      `${this.paths}/password`,
      validateDto(ChangePasswordDto),
      this.updatePassword,
    );

    /**
     * @swagger
     * /api/user/{id}:
     *   delete:
     *     tags:
     *       - Users
     *     summary: delete user
     *     operationId: "deleteUser"
     *     parameters:
     *       - name: id
     *         in: path
     *         description: l'id de l'utilisateur
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '201':
     *         description: delete user
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/DeleteUser'
     * components:
     *   schemas:
     *     DeleteUser:
     *        type: object
     *        properties:
     *          success:
     *                 type: boolean
     *                 example: true
     *          message:
     *                 type: string
     *                 example: "User has deleted"
     *          data:
     *              type: string
     *              nullable: true
     */
    this.router.delete(
      `${this.paths}/:id`,
      authMiddleware,
      authorizeRoles("admin"),
      this.deleteUser,
    );

    /**
     * @swagger
     * /api/user/forgot-password/{email}:
     *   post:
     *    tags:
     *      - Users
     *    summary: Send email when forgot password
     *    operationId: "forgotPassword"
     *    parameters:
     *      - name: email
     *        in: path
     *        description: l'email de l'utilisateur
     *        required: true
     *        schema:
     *          type: string
     *    responses:
     *      '201':
     *        description: Send mail user when he forgot password
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/ForgotPassword'
     * components:
     *   schemas:
     *     ForgotPassword:
     *        type: object
     *        properties:
     *          success:
     *                 type: boolean
     *                 example: true
     *          message:
     *                 type: string
     *                 example: "Email is sent"
     *          data:
     *              type: string
     *              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    this.router.post(
      `${this.paths}/forgot-password/:email`,
      validateParams(UserTypeParamDto),
      this.forgotPassword,
    );

    /**
     * @swagger
     * /api/user/{id}:
     *   get:
     *    tags:
     *      - Users
     *    summary: Get user by id
     *    operationId: "getUserById"
     *    parameters:
     *      - name: id
     *        in: path
     *        description: l'id de l'utilisateur
     *        required: true
     *        schema:
     *          type: string
     *    responses:
     *      '200':
     *        description: Successful operation
     *        content:
     *          application/json:
     *            schema:
     *              $ref: '#/components/schemas/GetUser'
     * components:
     *   schemas:
     *     GetUser:
     *       type: object
     *       properties:
     *         success:
     *                type: boolean
     *                example: true
     *         message:
     *                type: string
     *                example: "User found"
     *         data:
     *           type: object
     *           properties:
     *              id:
     *                type: number
     *                example: 1
     *              email:
     *                type: string
     *                example: "admin@admin.com"
     *              joinedAt:
     *                type: Date
     *                example: "20/20/2020"
     *              role:
     *                type: string
     *                example: "editor"
     *              state:
     *                type: string
     *                example: "inactive"
     */
    this.router.get(
      `${this.paths}/:id`,
      authMiddleware,
      authorizeRoles("admin"),
      this.getUserById,
    );

    // this.router.get(
    //   `${this.paths}/by/:email`,
    //   authMiddleware,
    //   this.getUserByEmail,
    // );
    this.router.post(
      `${this.paths}/contactus`,
      validateDto(ContactUsDto),
      this.contactUs,
    );
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

  // private getUserByEmail = async (
  //   req: express.Request,
  //   res: express.Response,
  // ) => {
  //   try {
  //     const email = req.params.email;
  //     const user = await this.userService.getUserByEmail(email);
  //     res.status(200).send(new Result(true, "The user!", user));
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       res.status(error.status).send(new Result(false, error.message, null));
  //     } else {
  //       res.status(500).send(new Result(false, "Internal server error", null));
  //     }
  //   }
  // };

  private getUserById = async (req: express.Request, res: express.Response) => {
    try {
      const user = await this.userService.getUserById(Number(req.params.id));
      res
        .status(201)
        .send(new Result(true, "User found", { ...user, password: undefined }));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private addEmail = async (req: express.Request, res: express.Response) => {
    try {
      await this.userService.addEmail(req.params.email);
      res
        .status(201)
        .send(new Result(true, `Email ${req.params.email} added!`, null));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private getAllEditor = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const editors = await this.userService.getAllUserEditor();
      res.status(201).send(
        new Result(
          true,
          "All editors!",
          editors.map(({ password, ...editor }) => editor),
        ),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private forgotPassword = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const email = req.params.email;
      const token =
        await this.userService.receiveEmailWhenForgotPassword(email);
      res.status(201).send(new Result(true, "Email is sent!", token));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private deleteUser = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await this.userService.deleteUser(Number(req.params.id));
      res.status(201).send(new Result(true, "User has deleted", null));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private activeAccount = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const informations: ChangePasswordDto = req.body;
      await this.userService.activeAccount(informations);
      res.status(201).send(new Result(true, "Your account is active", null));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private updatePassword = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const informations: ChangePasswordDto = req.body;
      const userId = await this.userService.updatePassword(informations);
      res.status(201).send(new Result(true, "Password changed", userId));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private createEditor = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const email = req.params.email;
      const token = await this.userService.createEditor(email);
      res.status(201).send(new Result(true, "Url is sent", token));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private allEmail = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const allEmails = await this.userService.getAllEmail();
      res.status(201).send(new Result(true, "All email", allEmails));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };
}

export default UserController;
