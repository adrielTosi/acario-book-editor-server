import { Request, Response } from "express";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";

export type Context = {
  req: Request;
  res: Response;
  redis: Redis;
  prisma: PrismaClient;
};
