import Article from "./content.interface";
import IArticlesRepository from "./contentRepository.interface";
import ArticleNotFoundException from "../exceptions/ArticleNotFoundException";
import NewslettersService from "newsletters/newsletters.service";
import { SendNewlettersDto } from "newsletters/newsletters.dto";
import BadRequestException from "../exceptions/BadRequestException";
import ContentAlreadyException from "../exceptions/ArticleAlreadyExistException";
import { CloudinaryService } from "cloudinary/cloudinary.service";
import { CreateContentDto, UpdateContentDto } from "./content.dto";

class ArticleService {
  constructor(
    private readonly repository: IArticlesRepository,
    private readonly newsletterService: NewslettersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  public async getLenghtOfAllMedias(): Promise<Number> {
    return await this.repository.getNumberOfAllMedias();
  }

  public async checkIfArticleTitleAlreadyExist(
    title: string,
    type: string,
  ): Promise<void> {
    const articleExist: boolean =
      await this.repository.isContentFoundByTitleExist(title, type);
    if (articleExist) throw new ContentAlreadyException(title, type);
  }

  public async updateArticleInformation(
    articleId: number,
    articleDto: UpdateContentDto,
  ): Promise<Article> {
    const articleFound = await this.ContentNotFound(articleId);
    const articleExistingWithTitle =
      await this.repository.isContentFoundByTitleExist(
        articleDto.title,
        articleFound.type,
      );
    if (articleExistingWithTitle)
      throw new ContentAlreadyException(articleDto.title, articleFound.type);
    return await this.repository.updateContentInformation(articleId, {
      title: articleDto.title ?? articleFound.title,
      contain: articleDto.contain ?? articleFound.contain,
    });
  }

  private async ContentNotFound(id: number) {
    const articleExist = await this.repository.getContentById(id);
    if (!articleExist) throw new ArticleNotFoundException(String(id));
    return articleExist;
  }

  public async deleteFileInArticle(
    articleId: number,
    fileId: string,
  ): Promise<string> {
    await this.ContentNotFound(articleId);
    const fileDeleted = await this.repository.deleteAFileInContent(
      articleId,
      fileId,
    );
    return fileDeleted;
  }

  public async deleteAllFilesInArticle(id: number): Promise<void> {
    await this.ContentNotFound(id);
    await this.repository.deleteAllFilesInContent(id);
  }

  public async createContent(
    newArticle: CreateContentDto,
    type: string,
    files?: any,
  ): Promise<Article> {
    const frontEndLink = process.env.URL.split(",")[0];

    await this.checkIfArticleTitleAlreadyExist(newArticle.title, type);
    if (files) {
      const results: { secure_url: string }[] =
        await this.cloudinaryService.uploadFiles(files);
      const urls = results.map((result) => result.secure_url);
      const articleCreatedWithFiles: Article =
        await this.repository.createContent(newArticle, type, urls);
      const newsLettersInformations: SendNewlettersDto = {
        subject: "Nouvel article ajouté",
        link:
          articleCreatedWithFiles.type == "project"
            ? `${frontEndLink}/project/posts?lire=${articleCreatedWithFiles.id}-${articleCreatedWithFiles.title
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[#,',\s]+/g, "-")
                .toLowerCase()}`
            : `${frontEndLink}/actualities/posts?lire=${articleCreatedWithFiles.id}-${articleCreatedWithFiles.title
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[#,',\s]+/g, "-")
                .toLowerCase()}`,
        textButton: "Cliquer ici",
        text: `Titre de l'article : ${newArticle.title}`,
      };
      await this.newsletterService.sendNewsletters(newsLettersInformations);
      return articleCreatedWithFiles;
    } else {
      const articleCreated: Article = await this.repository.createContent(
        newArticle,
        type,
      );
      const newsLettersInformations: SendNewlettersDto = {
        subject: "Nouvel article ajouté",
        link:
          articleCreated.type == "project"
            ? `${frontEndLink}/project/posts?lire=${articleCreated.id}-${articleCreated.title
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[#,',\s]+/g, "-")
                .toLowerCase()}`
            : `${frontEndLink}/actualities/posts?lire=${articleCreated.id}-${articleCreated.title
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[#,',\s]+/g, "-")
                .toLowerCase()}`,
        textButton: "Cliquer ici",
        text: `Titre de l'article : ${newArticle.title}`,
      };
      await this.newsletterService.sendNewsletters(newsLettersInformations);
      return articleCreated;
    }
  }

  public async getContentById(id: number): Promise<Article> {
    const articleFoundById = await this.repository.getContentById(id);
    if (!articleFoundById) throw new ArticleNotFoundException(String(id));
    return articleFoundById;
  }

  public async getAllArticleOrProjects(type: string): Promise<Article[] | []> {
    if (type == "article" || type == "project") {
      return await this.repository.getAllContent(type);
    }
    throw new BadRequestException();
  }

  public async deleteContent(id: number) {
    await this.getContentById(id);
    await this.repository.deleteContent(id);
  }
}

export default ArticleService;
