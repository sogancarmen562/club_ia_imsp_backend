import { Pool } from "pg";
import Article from "./content.interface";
import IArticlesRepository from "./contentRepository.interface";
import { CreateContentDto, UpdateContentDto } from "./content.dto";
import Content from "./content.interface";

class PostgresContentRepository implements IArticlesRepository {
  public pool: Pool;
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // ssl: {
      //   rejectUnauthorized: false,
      // },
    });
  }

  private convertRowToContent(rowContentCreated: any): Content {
    const article: Content = {
      id: rowContentCreated.id,
      title: rowContentCreated.title,
      contain: rowContentCreated.contain,
      type: rowContentCreated.type,
      createdAt: rowContentCreated.created_at.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      updatedAt: rowContentCreated.updated_at.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      filesUrl: rowContentCreated.medias,
      commingSoonAt: rowContentCreated.comming_soon_at,
    };

    return article;
  }

  public async updateDate(id: number): Promise<void> {
    try {
      await this.pool.query(
        "UPDATE content SET date_update = $1, WHERE id = $2;",
        [new Date(), id],
      );
    } catch (error) {}
  }

  public async deleteAllFilesInContent(id: number): Promise<void> {
    try {
      await this.pool.query(
        "UPDATE content SET medias = NULL, updated_at = $1 WHERE id = $2",
        [new Date(), id],
      );
    } catch (error) {}
  }

  public async deleteAFileInContent(
    articleId: number,
    fileId: string,
  ): Promise<string> {
    try {
      const result = await this.pool.query(
        "UPDATE content SET updated_at = $1, medias = (SELECT jsonb_agg(elem) FROM jsonb_array_elements(medias) WITH ORDINALITY arr(elem, idx) WHERE idx <> $2) WHERE id = $3;",
        [new Date(), fileId, articleId],
      );
      return result.rows[0].files_names;
    } catch (error) {}
  }

  public async updateContentInformation(
    articleId: number,
    article: UpdateContentDto,
    options?: {
      files?: any[] | null;
      commingSoonAt?: Date | null;
    },
  ): Promise<Article> {
    const result = await this.pool.query(
      `
    UPDATE content
    SET
      title = COALESCE(NULLIF($1, ''), title),
      contain = COALESCE(NULLIF($2, ''), contain),
      comming_soon_at = COALESCE($3, comming_soon_at),
      medias = CASE
        WHEN $4::jsonb IS NULL THEN medias
        ELSE COALESCE(medias, '[]'::jsonb) || $4::jsonb
      END,
      updated_at = NOW()
    WHERE id = $5
    RETURNING *;
    `,
      [
        article.title ?? "",
        article.contain ?? "",
        options?.commingSoonAt ?? null,
        options?.files ? JSON.stringify(options.files) : null,
        articleId,
      ],
    );

    return this.convertRowToContent(result.rows[0]);
  }

  public async createContent(
    newContent: CreateContentDto,
    type: string,
    options?: {
      files?: string[];
      commingSoonAt?: Date;
    },
  ): Promise<Article> {
    try {
      if (options?.files && options.files.length > 0) {
        const articleCreated = await this.insertArticleWithFilesInDatabase(
          newContent,
          type,
          options,
        );
        return this.convertRowToContent(articleCreated.rows[0]);
      }
      const articleCreated = await this.insertArticleInDatabase(
        newContent,
        type,
        options,
      );
      return this.convertRowToContent(articleCreated.rows[0]);
    } catch (error) {
      console.log(error);
    }
  }

  public async isContentFoundByTitleExist(
    title: string,
    type: string,
  ): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM content WHERE title = $1 AND type = $2`,
        [title, type],
      );
      if (result.rowCount != 0) return true;
      return false;
    } catch (error) {}
  }

  public async getNumberOfAllMedias(): Promise<Number> {
    try {
      const result = await this.pool.query("select * from articles.medias;");
      return result.rowCount;
    } catch (error) {}
  }

  public async deleteContent(id: number): Promise<void> {
    try {
      await this.pool.query(`DELETE FROM content WHERE id = $1`, [id]);
    } catch (error) {}
  }

  public async getContentById(articleId: number): Promise<Article | null> {
    try {
      const articleInformations = await this.pool.query(
        "SELECT * FROM content WHERE id = $1",
        [articleId],
      );
      if (!articleInformations) return null;
      return this.convertRowToContent(articleInformations.rows[0]);
    } catch (error) {}
  }

  public async getAllContent(type: string): Promise<Article[] | []> {
    try {
      const resultInformations = await this.pool.query(
        "SELECT * FROM content WHERE type = $1;",
        [type],
      );
      if (resultInformations.rowCount == 0) return [];
      const allArticle = resultInformations.rows.map((result) =>
        this.convertRowToContent(result),
      );
      return allArticle;
    } catch (error) {}
  }

  private async insertArticleInDatabase(
    article: CreateContentDto,
    type: string,
    options?: {
      files?: string[];
      commingSoonAt?: Date;
    },
  ) {
    try {
      const parseDateOrNull = (value: unknown): Date | null => {
        if (!value || typeof value !== "string" || value.trim() === "") {
          return null;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          return null;
        }

        return date;
      };
      if (type == "event" && options.commingSoonAt) {
        return await this.pool.query(
          "INSERT INTO content(title, contain, created_at, updated_at, type, comming_soon_at) VALUES ($1, $2, $3, $4, $5, $6) returning id, title, contain, created_at, updated_at, type, comming_soon_at;",
          [
            article.title,
            article.contain,
            new Date(),
            new Date(),
            type,
            parseDateOrNull(options.commingSoonAt),
          ],
        );
      }
      return await this.pool.query(
        "INSERT INTO content(title, contain, created_at, updated_at, type) VALUES ($1, $2, $3, $4, $5) returning id, title, contain, created_at, updated_at, type;",
        [article.title, article.contain, new Date(), new Date(), type],
      );
    } catch (error) {
      console.log(error);
    }
  }

  private async insertArticleWithFilesInDatabase(
    article: CreateContentDto,
    type: string,
    options?: {
      files?: string[];
      commingSoonAt?: Date;
    },
  ) {
    const parseDateOrNull = (value: unknown): Date | null => {
      if (!value || typeof value !== "string" || value.trim() === "") {
        return null;
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    };
    try {
      if (type == "event" && options.commingSoonAt) {
        return await this.pool.query(
          "INSERT INTO content(title, contain, created_at, updated_at, type, medias, comming_soon_at) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) returning id, title, contain, created_at, updated_at, type, comming_soon_at, medias;",
          [
            article.title,
            article.contain,
            new Date(),
            new Date(),
            type,
            JSON.stringify(options.files),
            parseDateOrNull(options.commingSoonAt),
          ],
        );
      }
      return await this.pool.query(
        "INSERT INTO content(title, contain, created_at, updated_at, type, medias) VALUES ($1, $2, $3, $4, $5, $6::jsonb) returning id, title, contain, created_at, updated_at, type, medias;",
        [
          article.title,
          article.contain,
          new Date(),
          new Date(),
          type,
          JSON.stringify(options.files),
        ],
      );
    } catch (error) {
      // console.log(error)
    }
  }
}

export default PostgresContentRepository;
