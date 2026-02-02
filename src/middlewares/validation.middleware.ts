import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { Request, Response, NextFunction } from "express";

export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObject = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => ({
        field: error.property,
        messages: Object.values(error.constraints || {}),
      }));

      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: formattedErrors,
      });
    } else {
      next();
    }
  };
}

export const validateParams = (Dto: any) => {
  return async (req, _res: Response, next) => {
    const paramsInstance = plainToInstance(Dto, req.params);

    const errors = await validate(paramsInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors
        .map((e) => Object.values(e.constraints || {}))
        .flat();

      _res.status(400).send({
        status: "error",
        message: "Validation failed",
        errors: messages,
      });
    } else {
      req.params = paramsInstance;
      next();
    }
  };
};
