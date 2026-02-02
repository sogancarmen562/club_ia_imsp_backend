import express from "express";
import { Result } from "../utils/utils";
import RequestWithUser from "interfaces/requestWithUser.interface";

const authorizeRoles = (...allowedRoles) => {
  return (
    req: RequestWithUser,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).send(new Result(false, "Access denied!", null));
      return;
    } else {
      next();
    }
  };
};

export default authorizeRoles;
