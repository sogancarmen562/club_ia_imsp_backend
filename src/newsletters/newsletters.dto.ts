import { IsNotEmpty, IsString } from "class-validator";

export class SendNewlettersDto {
  @IsNotEmpty()
  @IsString()
  public subject: string;
  @IsNotEmpty()
  @IsString()
  public link: string;
  @IsString()
  @IsNotEmpty()
  public textButton: string;
  @IsString()
  @IsNotEmpty()
  public text: string;
}

export class SendNewsLetterDto {
  @IsNotEmpty()
  @IsString()
  public subject: string;
  @IsString()
  @IsNotEmpty()
  public text: string;
}