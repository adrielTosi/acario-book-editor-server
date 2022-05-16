import "reflect-metadata";
import "dotenv-safe";
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
import { ReadLaterResolver } from "./resolvers/ReadLaterResolver";

declare module "express-session" {
  interface Session {
    userId: string;
  }
}

const prisma = new PrismaClient({
  log: ["query"],
});

const main = async () => {
  dotenv.config();

  const app = express();

  const RedisStore = redisStore(session);
  const redis = new Redis(process.env.REDIS_URL);

  app.set("trust proxy", 1);
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
        // COULD HAVE PROBLEM WITH FORWARDING COOCKIES
        domain:
          process.env.NODE_ENV === "production" ? ".scrivono.xyz" : undefined,
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
        ReadLaterResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }): Context => ({ req, res, redis, prisma }),
    playground: true,
    introspection: true,
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  const port = parseInt(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log("app listen on port: ", port);
  });
};

main().catch((err) => console.error(err));
