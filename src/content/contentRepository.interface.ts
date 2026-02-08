import { CreateContentDto, UpdateContentDto } from "./content.dto";
import Content from "./content.interface";

interface IContentRepository {
  createContent(
    newContent: CreateContentDto,
    type: string,
    options?: {
      files?: string[];
      commingSoonAt?: Date;
    },
  ): Promise<Content>;
  isContentFoundByTitleExist(title: string, type: string): Promise<boolean>;
  getAllContent(type: string): Promise<Content[] | []>;
  getContentById(id: number): Promise<Content | null>;
  deleteContent(id: number): Promise<void>;
  deleteAllFilesInContent(articleId: number): Promise<void>;
  deleteAFileInContent(articleId: number, fileId: string): Promise<string>;
  updateContentInformation(
    articleId: number,
    article: UpdateContentDto,
    options?: {
      files?: any[];
      commingSoonAt?: Date;
    },
  ): Promise<Content>;
  updateDate(articleId: number): Promise<void>;
  getNumberOfAllMedias(): Promise<Number>;
}

export default IContentRepository;
