import { Context } from "../types";
import { AuthenticationError } from "apollo-server-express";
import { MiddlewareFn } from "type-graphql";

export const isLogged: MiddlewareFn<Context> = async ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new AuthenticationError("Not authenticated.");
  }

  return next();
};

export default isLogged;
