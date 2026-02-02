import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UserTypeParamDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  public email: string;
}


