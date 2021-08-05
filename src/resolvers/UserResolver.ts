import argon2 from "argon2";
import { UserInputError, AuthenticationError } from "apollo-server-express";
import v from "validator";

import { User } from "../entities/User";
import { Context } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";

@InputType({ description: "Data for creating new user" })
class InputCreateUser {
  @Field()
  name: string;
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}

@Resolver((_of) => User)
export class UserResolver {
  /**
   * @CREATE_USER
   */
  @Mutation(() => User)
  async createUser(
    @Arg("userData") data: InputCreateUser,
    @Ctx() ctx: Context
  ): Promise<User> {
    // TODO: add validation, lenght etc

    if (!v.isEmail(data.email)) {
      throw new UserInputError("Please add a Valid email");
    }

    const userByEmail = await ctx.prisma.user.findUnique({
      where: { email: data.email },
    });
    const userByUsername = await ctx.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (userByEmail) {
      throw new UserInputError("A user with this email already exists.");
    }
    if (userByUsername) {
      throw new UserInputError("A user with this username already exists.");
    }

    const hashPassword = await argon2.hash(data.password);
    const newUser = await ctx.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashPassword,
        username: data.username,
      },
    });
    ctx.req.session.userId = newUser.id;
    return newUser;
  }

  /**
   * @LOGIN
   */
  @Mutation(() => User)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() ctx: Context
  ): Promise<User> {
    const user = await ctx.prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new UserInputError("Incorrect email or password.");
    }

    const rightPassword = await argon2.verify(user.password, password);
    if (!rightPassword) {
      throw new UserInputError("Incorrect email or password.");
    }

    ctx.req.session.userId = user.id;
    return user;
  }

  /**
   * @LOGOUT
   */
  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: Context): Promise<boolean> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        // ? Should the cookie be deleted even if the session was not destroyed. If yes, should be move to below the if statement
        res.clearCookie(process.env.COOKIE_NAME!);

        if (err) {
          console.log(err);
          resolve(false);
        }

        resolve(true);
      })
    );
  }

  /**
   * @ALL_USERS
   */
  @Query(() => [User])
  async allUsers(@Ctx() ctx: Context) {
    return ctx.prisma.user.findMany();
  }

  /**
   * @CURRENT_USER
   */

  @Query(() => User)
  async currentUser(@Ctx() ctx: Context): Promise<User> {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
      include: { following: true },
    });

    if (!user) {
      throw new AuthenticationError("Please login.");
    }

    return user;
  }
}
