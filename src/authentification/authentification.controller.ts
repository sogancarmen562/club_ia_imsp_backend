import express, { Router } from "express";
import AuthentificationService from "./authentification.service";
import HashPasswordBcryptService from "../hashPassword/hashPasswordBcrypt.service";
import Controller from "interfaces/controllers.interface";
import { validateDto } from "../middlewares/validation.middleware";
import { LoginDto } from "./login.dto";
import { Result } from "../utils/utils";
import HttpException from "../exceptions/HttpException";
import PostgresUserRepository from "../users/postgresUser.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import RequestWithUser from "interfaces/requestWithUser.interface";
import { serialize } from "cookie";

class AuthentificationController implements Controller {
  public paths = "/api/auth";
  public router = express.Router();
  private authentificationService = new AuthentificationService(
    new HashPasswordBcryptService(),
    new PostgresUserRepository(),
  );

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Authentification
     *     description: Operations about authentification
     */

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     tags:
     *       - Authentification
     *     summary: Logs in and returns the authentication  token
     *     operationId: "logginIn"
     *     requestBody:
     *       description: A JSON object containing the login and password.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       '200':
     *         description: sucessful operation
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Token'
     *       '400':
     *          description: User not found
     *          content:
     *            application/json:
     *              schema:
     *                $ref: '#/components/schemas/Credentials'
     *       '404':
     *          description: Wrong credentials provided
     *          content:
     *            application/json:
     *              schema:
     *                $ref: '#/components/schemas/NotFound'
     * components:
     *   schemas:
     *     LoginRequest:
     *       type: object
     *       properties:
     *         email:
     *           type: string
     *           example: "myemail@gmail.com"
     *         password:
     *           type: string
     *           example: "njhfbrehfbsdh1*"
     *
     *     Token:
     *       type: object
     *       properties:
     *         success:
     *           type: boolean
     *           example: true
     *         message:
     *           type: string
     *           example: "You are connected"
     *         data:
     *           type: string
     *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *
     *     Credentials:
     *       type: object
     *       properties:
     *         success:
     *           type: boolean
     *           example: false
     *         message:
     *           type: string
     *           example: "Wrong credentials provided"
     *         data:
     *           type: string
     *           nullable: true
     *
     *     NotFound:
     *       type: object
     *       properties:
     *         success:
     *           type: boolean
     *           example: false
     *         message:
     *           type: string
     *           example: "User not found"
     *         data:
     *           type: string
     *           nullable: true
     */
    this.router.post(
      `${this.paths}/login`,
      validateDto(LoginDto),
      this.logginIn,
    );

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     tags:
     *       - Authentification
     *     summary: Delete token in  cookie
     *     operationId: "loggingOut"
     *     responses:
     *       '200':
     *         description: OK
     */
    this.router.post(`${this.paths}/logout`, this.loggingOut);
    this.router.get(`${this.paths}/me`, authMiddleware, this.authenticate);
  }

  private authenticate = async (
    request: RequestWithUser,
    response: express.Response,
  ) => {
    try {
      response.status(201).send(
        new Result(true, "the value", {
          isTrue: true,
          user: request.user,
        }),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        response
          .status(error.status)
          .send(new Result(false, error.message, null));
      } else {
        response
          .status(500)
          .send(new Result(false, "Internal server error", null));
      }
    }
  };

  private logginIn = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const logInData: LoginDto = request.body;
      const result = await this.authentificationService.loginAdmin(logInData);
      response.setHeader(
        "Set-Cookie",
        serialize("token", result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        }),
      );
      response
        .status(200)
        .send(new Result(true, "you are connected", result.token));
    } catch (error) {
      if (error instanceof HttpException) {
        response
          .status(error.status)
          .send(new Result(false, error.message, null));
      } else {
        response
          .status(500)
          .send(new Result(false, "Internal server error", null));
      }
    }
  };

  private loggingOut = (
    request: express.Request,
    response: express.Response,
  ) => {
    response.setHeader("Set-Cookie", [
      "Authorization=; Path=/; Max-Age=0; SameSite=None; Secure=true; Partitioned",
    ]);
    response.sendStatus(200);
  };
}

export default AuthentificationController;
