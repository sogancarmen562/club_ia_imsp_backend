import express from "express";
import RequestWithUser from "interfaces/requestWithUser.interface";
import jwt from "jsonwebtoken";
import DataStoredInToken from "token/dataStorageInToken.interface";
import { Result } from "../utils/utils";

export function authMiddleware(
  request: RequestWithUser,
  response: express.Response,
  next: express.NextFunction
) {
  const token = request.cookies?.token;
  if (token) {
    const user = decodedToken(token);
    if (Number(user?._id) > 0) {
      request.user = {
        email: user?._email,
        id: user?._id,
        role: user?._role,
        joinedAt: null,
        state: null,
        password: null,
      }
      next();
    } else {
      response.send(new Result(false, "Wrong credentials provided", null));
    }
  } else {
    response.send(new Result(false, "Wrong authentication token", null));
    // next(new AuthenticationTokenMissingException());
  }
}

export function decodedToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    const verificationResponse = jwt.verify(token, secret) as DataStoredInToken;
    return verificationResponse;
  } catch {
    return null;
  }
}
