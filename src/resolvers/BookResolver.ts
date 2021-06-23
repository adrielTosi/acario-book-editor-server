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
  UseMiddleware,
} from "type-graphql";
import { isLogged } from "../middleware/isLogged";

@InputType()
export class InputNewBook {
  @Field()
  title: string;

  @Field()
  description: string;
}

@Resolver((_of) => Book)
export class BookResolver {
  // TODO: CREATE `UPDATE` MUTATION
  /**
   * @CREATE_BOOK
   */
  @Mutation(() => Book)
  @UseMiddleware(isLogged)
  async createBook(
    @Arg("bookData") data: InputNewBook,
    @Ctx() ctx: Context
  ): Promise<Book> {
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
   * @GET_BOOK
   */
  @Query(() => Book)
  @UseMiddleware(isLogged)
  async getBook(
    @Arg("bookId") bookId: string,
    @Ctx() ctx: Context
  ): Promise<Book> {
    const book = await ctx.prisma.book.findUnique({
      where: { id: bookId },
      include: { chapters: true, author: true },
    });

    if (!book) {
      throw new UserInputError("Book doesn't exist.");
    }

    return book;
  }

  /**
   * @GET_BOOKS
   */
  @Query(() => [Book])
  @UseMiddleware(isLogged)
  async getBooks(@Ctx() ctx: Context): Promise<Book[]> {
    const books = await ctx.prisma.book.findMany({
      where: { authorId: ctx.req.session.userId },
      include: { chapters: true },
    });

    if (!books) {
      throw new UserInputError("No books found");
    }

    return books;
  }

  /**
   * @DELETE_BOOK
   */
  @Mutation(() => Boolean)
  @UseMiddleware(isLogged)
  async deleteBook(
    @Arg("bookId") id: string,
    @Ctx() ctx: Context
  ): Promise<Boolean> {
    const book = await ctx.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new UserInputError("No book found.");
    }

    if (book.authorId !== ctx.req.session.userId) {
      throw new AuthenticationError("Book is not yours.");
    }

    await ctx.prisma.chapter.deleteMany({ where: { bookId: id } });
    await ctx.prisma.book.delete({ where: { id } });
    return true;
  }
}
