import bcrypt from "bcrypt";
import {
  UserInputError,
  AuthenticationError,
  ApolloError,
} from "apollo-server-express";
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
  UseMiddleware,
} from "type-graphql";
import isLogged from "../middleware/isLogged";
import InputUpdateProfile from "./interfaces/InputUpdateProfile";
import { StatusEnum } from "./interfaces/Status.enum";

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
   * TODO: ERROR WHEN ASKING FOR RETURNING SOMETHING DIFFERENT THAN name, email, username, password
   */
  @Mutation(() => User)
  async createUser(
    @Arg("userData") data: InputCreateUser,
    @Ctx() ctx: Context
  ): Promise<Pick<User, "name" | "email" | "username" | "password">> {
    // TODO: add validation, lenght etc

    if (!v.isEmail(data.email)) {
      throw new UserInputError("Please add a Valid email");
    }

    const userByEmail = await ctx.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (userByEmail) {
      throw new UserInputError("A user with this email already exists.");
    }

    const userByUsername = await ctx.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (userByUsername) {
      throw new UserInputError("A user with this username already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(data.password, salt);
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

    const rightPassword = await bcrypt.compare(password, user.password);
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
  @UseMiddleware(isLogged)
  async currentUser(@Ctx() ctx: Context): Promise<User> {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
      include: {
        following: true,
        chapterReactions: true,
        comments: true,
        followers: true,
        chapters: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("Please login.");
    }

    return user;
  }

  /**
   * @GET_USER
   * TODO: ADD PAGINATION
   */
  @Query(() => User)
  // @UseMiddleware(isLogged)
  async getUser(
    @Arg("username") username: string,
    @Ctx() ctx: Context
  ): Promise<User> {
    // const currentUser = await ctx.prisma.user.findUnique({
    //   where: { id: ctx.req.session.userId },
    // });

    // if (!currentUser) {
    //   throw new AuthenticationError("Please login.");
    // }

    const user = await ctx.prisma.user.findUnique({
      where: { username },
      include: {
        following: true,
        followers: {
          where: {
            followId: ctx.req.session?.userId,
          },
        },
        chapters: {
          take: 10,
          where: { status: StatusEnum.Published },
          include: {
            author: true,
            comments: {
              include: {
                author: true,
              },
            },
            ...(ctx.req.session.userId && {
              reactions: {
                where: { authorId: ctx.req.session.userId },
              },
            }),
          },
        },
        _count: {
          select: { chapters: true, followers: true, following: true },
        },
      },
    });
    if (!user) {
      throw new UserInputError("This user does not exist or has been deleted.");
    }

    return user;
  }

  /**
   * @UPDATE_PROFILE
   */
  @Mutation(() => User)
  @UseMiddleware(isLogged)
  async updateProfile(
    @Arg("data") data: InputUpdateProfile,
    @Ctx() ctx: Context
  ): Promise<User> {
    const currentUser = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!currentUser) {
      throw new AuthenticationError("Please login.");
    }

    try {
      const updatedUser = await ctx.prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: data.name,
          avatarSeed: data.avatarSeed,
          avatarType: data.avatarType,
          bio: data.bio,
        },
        include: {
          following: true,
          followers: {
            where: {
              followId: ctx.req.session?.userId,
            },
          },
          chapters: {
            take: 10,
            include: {
              author: true,
              comments: {
                include: {
                  author: true,
                },
              },
              ...(ctx.req.session.userId && {
                reactions: {
                  where: { authorId: ctx.req.session.userId },
                },
              }),
            },
          },
          _count: {
            select: { chapters: true, followers: true, following: true },
          },
        },
      });
      return updatedUser;
    } catch (err) {
      throw new ApolloError(err.message);
    }
  }
}
