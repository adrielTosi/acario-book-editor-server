import { AuthenticationError, UserInputError } from "apollo-server-express";
import { Book } from "../entities/Book";
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

@InputType()
export class InputNewBook {
  @Field()
  title: string;

  @Field()
  description: string;
}

@Resolver((_of) => Book)
export class BookResolver {
  /**
   * @CREATE_BOOK
   */
  @Mutation(() => Book)
  async createBook(
    @Arg("bookData") data: InputNewBook,
    @Ctx() ctx: Context
  ): Promise<Book> {
    if (!ctx.req.session.userId) {
      throw new AuthenticationError("Please login to create a Book.");
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!user) {
      throw new AuthenticationError("Invalid user.");
    }

    const newBook = await ctx.prisma.book.create({
      data: {
        description: data.description,
        title: data.title,
        authorId: user.id,
        chapters: {
          create: {
            title: "First Chapter",
            authorId: user.id,
            text: "sample chapter",
          },
        },
      },
      include: {
        chapters: true,
      },
    });

    return newBook;
  }

  /**
   * @GET_BOOKS
   */
  @Query(() => [Book])
  async getBooks(@Ctx() ctx: Context): Promise<Book[]> {
    if (!ctx.req.session.userId) {
      throw new AuthenticationError("Please login to create a Book.");
    }

    const books = await ctx.prisma.book.findMany({
      where: { authorId: ctx.req.session.userId },
      include: { chapters: true },
    });

    if (!books) {
      throw new UserInputError("No books found");
    }

    return books;
  }
}
