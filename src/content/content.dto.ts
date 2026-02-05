import { Type } from "class-transformer";
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  public title: string;
  @IsString()
  @IsNotEmpty()
  public contain: string;
  
  // @IsDate({ message: "commingSoonAt must be a valid date" })
  @IsOptional()
  // @Type(() => Date)
  @ValidateIf((o) => o.type === "event")
  public commingSoonAt: Date;
}

export class ContentTypeParamDto {
  @IsString()
  @IsIn(["article", "project", "event"], {
    message: "type must be 'article' or 'project' or 'event'",
  })
  type: string;
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  public title?: string;
  @IsString()
  @IsOptional()
  public contain?: string;
}
