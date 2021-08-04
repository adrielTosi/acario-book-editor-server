import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { PrismaClient } from "@prisma/client";

import express from "express";
import Redis from "ioredis";
import session from "express-session";
import redisStore from "connect-redis";

import cors from "cors";
import dotenv from "dotenv";
import { buildSchema } from "type-graphql";
import { Context } from "./types";

import { UserResolver } from "./resolvers/UserResolver";
import { BookResolver } from "./resolvers/BookResolver";
import { ChapterResolver } from "./resolvers/ChapterResolver";
import { TagsResolver } from "./resolvers/TagsResolver";
import { FollowResolver } from "./resolvers/FollowResolver";
import { CommentResolver } from "./resolvers/CommentResolver";
import { ReactionResolver } from "./resolvers/ReactionResolver";

declare module "express-session" {
  interface Session {
    userId: string;
  }
}

const prisma = new PrismaClient();

const main = async () => {
  dotenv.config();

  const app = express();

  const RedisStore = redisStore(session);
  const redis = new Redis();

  app.use(
    session({
      name: process.env.COOKIE_NAME,
      store: new RedisStore({ client: redis as any, disableTouch: true }), // I had to add this `as any` because the types were incompatible https://github.com/tj/connect-redis/issues/300
      secret: process.env.SESSION_SECRET!,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        UserResolver,
        BookResolver,
        ChapterResolver,
        TagsResolver,
        FollowResolver,
        CommentResolver,
        ReactionResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }): Context => ({ req, res, redis, prisma }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log("app listen on port: ", port);
  });
};

main()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect();
  });
