import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  public title: string;
  @IsString()
  @IsNotEmpty()
  public contain: string;
}

export class ContentTypeParamDto {
  @IsString()
  @IsIn(["article", "project"], {
    message: "type must be 'article' or 'project'",
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
