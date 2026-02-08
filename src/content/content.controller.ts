import Controller from "interfaces/controllers.interface";
import express from "express";
import ArticleService from "./content.service";
import PostgresArticlesRepository from "./postgresContent.repository";
import {
  validateDto,
  validateParams,
} from "../middlewares/validation.middleware";
import { Result } from "../utils/utils";
import HttpException from "../exceptions/HttpException";
import upload from "../config/saveFilesInDiskServer/multer.config";
import { authMiddleware } from "../middlewares/auth.middleware";
import authorizeRoles from "../middlewares/role.middleware";
import NewslettersService from "../newsletters/newsletters.service";
import EmailSendNodeMailerService from "../mail/sendMailNodeMailer.service";
import UserService from "../users/user.service";
import PostgresUserRepository from "../users/postgresUser.repository";
import GenerateCodeNanoIdService from "../generateCode/generateCode.service";
import HashPasswordBcryptService from "../hashPassword/hashPasswordBcrypt.service";
import AuthentificationService from "../authentification/authentification.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import {
  ContentTypeParamDto,
  CreateContentDto,
  UpdateContentDto,
} from "./content.dto";

class ContentController implements Controller {
  public paths = "/api/content";
  public router = express.Router();
  private articleService = new ArticleService(
    new PostgresArticlesRepository(),
    new NewslettersService(
      new EmailSendNodeMailerService(),
      new UserService(
        new PostgresUserRepository(),
        new GenerateCodeNanoIdService(),
        new HashPasswordBcryptService(),
        new AuthentificationService(
          new HashPasswordBcryptService(),
          new PostgresUserRepository(),
        ),
        new EmailSendNodeMailerService(),
      ),
    ),
    new CloudinaryService(),
  );

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    /**
     * @swagger
     * /api/content/{type}:
     *   post:
     *     tags:
     *       - Content
     *     consumes:
     *       - multipart/form-data
     *     summary: Create a new content (ADMIN OR EDITOR)
     *     operationId: "createContent"
     *     parameters:
     *       - name: type
     *         in: path
     *         description: Le type peut être article ou project ou event(si event commingSoonAt est obligatoire)
     *         required: true
     *         schema:
     *           type: string
     *           format: int64
     *     requestBody:
     *       description: name and description are REQUIRED but files is OPTIONNAL.
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             $ref: '#/components/schemas/CreateArticle'
     *     responses:
     *       '201':
     *         description: project created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Articles'
     *       '401':
     *         description: Authorization information is missing or invalid.
     * components:
     *   schemas:
     *     CreateArticle:
     *       type: object
     *       required:
     *         - title
     *         - contain
     *       properties:
     *         title:
     *           type: string
     *           example: "write a document"
     *         contain:
     *           type: string
     *           example: "write a contain of document"
     *         commingSoonAt:
     *           type: Date
     *           example: "2022-02-18"
     *         media:
     *           type: array
     *           items:
     *             type: string
     *             format: binary
     */
    this.router.post(
      `${this.paths}/:type`,
      authMiddleware,
      authorizeRoles("admin", "editor"),
      validateParams(ContentTypeParamDto),
      upload.array("media", 10),
      validateDto(CreateContentDto),
      this.createContent,
    );

    /**
     * @swagger
     * /api/content/{id}:
     *    put:
     *      tags:
     *        - Content
     *      consumes:
     *        - multipart/form-data
     *      summary: Updating an existing article or project
     *      operationId: "updateArticleInformation"
     *      parameters:
     *        - name: id
     *          in: path
     *          description: Article ID
     *          required: true
     *          schema:
     *            type: integer
     *            format: int64
     *      requestBody:
     *        description: name and description are REQUIRED but files is OPTIONNAL.
     *        required: true
     *        content:
     *          multipart/form-data:
     *            schema:
     *              $ref: '#/components/schemas/UpdateArticle'
     *      responses:
     *        '200':
     *          description: successfull operation
     *          content:
     *            application/json:
     *              schema:
     *                $ref: '#/components/schemas/ArticlesId'
     *        '400':
     *          description: Invalid ID supplied
     *        '404':
     *          description: Project not found
     *        '405':
     *          description: Validation exception
     * components:
     *   schemas:
     *     UpdateArticle:
     *       type: object
     *       properties:
     *         title:
     *           type: string
     *           example: "write a document"
     *         contain:
     *           type: string
     *           example: "write a contain of document"
     *         commingSoonAt:
     *           type: Date
     *           example: "2022-02-18"
     *         media:
     *           type: array
     *           item:
     *             type: string
     *             format: binary
     */
    this.router.put(
      `${this.paths}/:id`,
      authMiddleware,
      authorizeRoles("admin", "editor"),
      validateDto(UpdateContentDto),
      this.updateArticleInformation,
    );

    /**
     * @swagger
     * tags:
     *   - name: Content
     *     description: Operations about Content
     * /api/content/{type}:
     *   get:
     *     tags:
     *       - Content
     *     summary: Returns the list of articles or projects (ALL)
     *     operationId: "getAllArticles"
     *     parameters:
     *       - name: type
     *         in: path
     *         description: Le type peut être article ou project
     *         required: true
     *         schema:
     *           type: string
     *           format: int64
     *     responses:
     *       '200':
     *         description: successful operation
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Articles'
     *       '401':
     *         description: Authorization information is missing or invalid.
     * components:
     *   schemas:
     *     Articles:
     *       type: object
     *       properties:
     *         sucess:
     *               type: boolean
     *               example: true
     *         message:
     *               type: string
     *               example: "the message"
     *         data:
     *             type: array
     *             items:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                   format: int64
     *                   example: 2
     *                 title:
     *                   type: string
     *                   example: MyArticle
     *                 contain:
     *                   type: string
     *                   example: Contain of MyArticle
     *                 createdAt:
     *                   type: Date
     *                   example: "01/01/2020"
     *                 updatedAt:
     *                   type: Date
     *                   example: "01/01/2026"
     *                 filesUrl:
     *                   type: array
     *                   items:
     *                      type: string
     *                      example: "https://res.cloudinary.com/diia9z7py/image/upload/v1769971242/emails/mke7po87tdqn0uzp0ywd.png"
     */
    this.router.get(`${this.paths}/:type`, this.getAllArticlesOrProjects);

    /**
     * @swagger
     * /api/content/by/{id}:
     *   get:
     *     tags:
     *       - Content
     *     summary: Find content by ID (ALL)
     *     operationId: "getArticleById"
     *     parameters:
     *       - name: id
     *         in: path
     *         description: Article ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     responses:
     *       '200':
     *         description: successful operation
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ArticlesId'
     *       '400':
     *         description: Invalid ID supplied
     *       '404':
     *         description: Content not found
     * components:
     *   schemas:
     *     ArticlesId:
     *       type: object
     *       properties:
     *         sucess:
     *               type: boolean
     *               example: true
     *         message:
     *               type: string
     *               example: "the message"
     *         data:
     *             type: object
     *             properties:
     *               id:
     *                 type: integer
     *                 format: int64
     *                 example: 2
     *               title:
     *                 type: string
     *                 example: MyArticle
     *               contain:
     *                 type: string
     *                 example: Contain of MyArticle
     *               createdAt:
     *                 type: Date
     *                 example: "01/01/2020"
     *               updatedAt:
     *                 type: Date
     *                 example: "01/01/2026"
     *               filesUrl:
     *                 type: array
     *                 items:
     *                     type: string
     *                     example: "https://res.cloudinary.com/diia9z7py/image/upload/v1769971242/emails/mke7po87tdqn0uzp0ywd.png"
     */
    this.router.get(`${this.paths}/by/:id`, this.getArticleById);

    /**
     * @swagger
     * /api/content/{id}:
     *   delete:
     *     tags:
     *       - Content
     *     summary: Delete a content (ADMIN OU EDITOR)
     *     operationId: "deleteArticle"
     *     parameters:
     *       - name: id
     *         in: path
     *         description: Article ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     responses:
     *       '201':
     *         description: Article deleted
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ArticlesDelete'
     *       '400':
     *         description: Invalid ID supplied
     *       '404':
     *         description: Article not found
     * components:
     *   schemas:
     *     ArticlesDelete:
     *       type: object
     *       properties:
     *         sucess:
     *               type: boolean
     *               example: true
     *         message:
     *               type: string
     *               example: "Article with id 2 has deleted!"
     *         data:
     *             type: string
     *             nullable: true
     */
    this.router.delete(
      `${this.paths}/:id`,
      authMiddleware,
      authorizeRoles("admin", "editor"),
      this.deleteArticle,
    );

    /**
     * @swagger
     * /api/content/{id}/medias:
     *   delete:
     *     tags:
     *       - Content
     *     summary: Delete all medias in Article
     *     operationId: "deleteAllMedias"
     *     parameters:
     *       - name: id
     *         in: path
     *         description: Article ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     responses:
     *       '204':
     *         description: OK
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TheResponse2'
     *       '400':
     *         description: Invalid ID supplied
     *       '404':
     *         description: Article not found
     * components:
     *   schemas:
     *     TheResponse2:
     *       type: object
     *       properties:
     *        success:
     *           type: boolean
     *           example: true
     *        message:
     *           type: string
     *           example: "All medias in article id has deleted"
     *        data:
     *           type: string
     *           nullable: true
     */
    this.router.delete(
      `${this.paths}/:id/medias`,
      authMiddleware,
      authorizeRoles("admin", "editor"),
      this.deleteAllMedias,
    );

    /**
     * @swagger
     * /api/content/{id}/medias/{mediasid}:
     *   delete:
     *     tags:
     *       - Content
     *     summary: Delete a media in Article
     *     operationId: "deleteAMediasInArticle"
     *     parameters:
     *       - name: id
     *         in: path
     *         description: Article ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *       - name: mediasid
     *         in: path
     *         description: Media ID
     *         required: true
     *         schema:
     *           type: integer
     *           format: int64
     *     responses:
     *       '204':
     *         description: OK
     *       '400':
     *         description: Invalid ID supplied
     *       '404':
     *         description: Article not found
     */
    this.router.delete(
      `${this.paths}/:id/medias/:mediasid`,
      authMiddleware,
      authorizeRoles("admin", "editor"),
      this.deleteAMediasInArticle,
    );
  }

  private deleteAMediasInArticle = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      await this.articleService.deleteFileInArticle(
        Number(req.params.id),
        req.params.mediasid,
      );
      res
        .status(201)
        .send(
          new Result(
            true,
            `Medias with id ${req.params.mediasid} has deleted in article with id ${req.params.id}!`,
            null,
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

  private deleteAllMedias = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      await this.articleService.deleteAllFilesInArticle(Number(req.params.id));
      res
        .status(201)
        .send(
          new Result(
            true,
            `All medias in article ${req.params.id} has deleted`,
            null,
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

  private updateArticleInformation = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const articleInfo: UpdateContentDto = req.body;

      const articleUpdated = await this.articleService.updateArticleInformation(
        Number(req.params.id),
        articleInfo,
        {
          files: Array.isArray(req.files) ? req.files : null,
          commingSoonAt: articleInfo.commingSoon ?? null,
        },
      );

      res
        .status(200)
        .send(new Result(true, "Article mis à jour", articleUpdated));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private deleteArticle = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      await this.articleService.deleteContent(Number(req.params.id));
      res
        .status(201)
        .send(
          new Result(
            true,
            `Article with id ${req.params.id} has deleted!`,
            null,
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

  private getAllArticlesOrProjects = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const allArticles = await this.articleService.getAllArticleOrProjects(
        req.params.type,
      );
      res
        .status(201)
        .send(new Result(true, `All ${req.params.type}`, allArticles));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private getArticleById = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const articleFoundById = await this.articleService.getContentById(
        Number(req.params.id),
      );
      res.status(201).send(new Result(true, "Article found", articleFoundById));
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };

  private createContent = async (
    req: express.Request,
    res: express.Response,
  ) => {
    try {
      const article: CreateContentDto = req.body;
      if (Array.isArray(req.files) && req.files.length > 0) {
        const newArticle = await this.articleService.createContent(
          article,
          req.params.type,
          {
            files: req.files.map((file) => file),
            commingSoonAt:
              req.params.type == "event" ? article.commingSoonAt : null,
          },
        );
        res
          .status(201)
          .send(
            new Result(
              true,
              `${req.params.type} ${newArticle?.title} is created!`,
              newArticle,
            ),
          );
      } else {
        const newArticle = await this.articleService.createContent(
          article,
          req.params.type,
          {
            files: null,
            commingSoonAt:
              req.params.type == "event" ? article.commingSoonAt : null,
          },
        );
        console.log(newArticle);
        res
          .status(201)
          .send(
            new Result(
              true,
              `${req.params.type} ${newArticle?.title} is created!`,
              newArticle,
            ),
          );
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        res.status(error.status).send(new Result(false, error.message, null));
      } else {
        res.status(500).send(new Result(false, "Internal server error", null));
      }
    }
  };
}

export default ContentController;
