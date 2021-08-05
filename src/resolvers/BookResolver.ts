import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server-express";
import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Book } from "../entities/Book";
import { isLogged } from "../middleware/isLogged";
import { Context } from "../types";
import InputTag from "./inputs/InputTags";

@InputType()
export class InputNewBook {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => [InputTag], { nullable: true })
  tags?: InputTag[];
}

@ObjectType()
export class PaginatedTimelineBooks {
  @Field(() => [Book])
  books: Book[];

  @Field()
  hasMore?: boolean;
}

@Resolver((_of) => Book)
export class BookResolver {
  /**
   * @GET
   * @TIMELINE_BOOKS
   */
  @Query(() => PaginatedTimelineBooks)
  @UseMiddleware(isLogged)
  async getTimelineBooks(
    @Arg("take") take: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, // a DateTime value
    @Ctx() ctx: Context
  ): Promise<PaginatedTimelineBooks> {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
      include: { following: true },
    });
    if (!user) {
      throw new AuthenticationError("Invalid user.");
    }

    let cursorDate: Date | undefined;
    if (cursor) {
      cursorDate = new Date(parseInt(cursor));
    }

    const books = await ctx.prisma.book.findMany({
      take,
      where: {
        authorId: { in: user.following.map((follow) => follow.followId) },
        createdAt: cursor ? { lt: cursorDate } : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: true,
        tags: true,
      },
    });
    if (!books) {
      throw new ApolloError(
        "Something went wrong, please refresh and tr again."
      );
    }

    let hasMore = true;
    if (books.length < take) hasMore = false;
    return { books, hasMore };
  }

  // TODO: CREATE `UPDATE` MUTATION
  /**
   * @CREATE_BOOK
   */
  @Mutation(() => Book)
  @UseMiddleware(isLogged)
  async createBook(
    @Ctx() ctx: Context,
    @Arg("data") data: InputNewBook
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
            chapterNumber: 1,
          },
        },
        tags: data.tags
          ? {
              createMany: {
                data: data.tags.map((tag) => ({
                  label: tag.label,
                  value: tag.value,
                  authorId: user.id,
                })),
              },
            }
          : undefined,
      },
      include: {
        chapters: true,
        tags: !!data.tags,
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
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const book = await ctx.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          orderBy: {
            chapterNumber: "asc",
          },
        },
        author: true,
        tags: true,
        comments: true,
      },
    });

    if (!book) {
      throw new UserInputError("Book doesn't exist.");
    }
    if (book.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    return book;
  }

  /**
   * @GET_BOOKS
   */
  @Query(() => [Book])
  @UseMiddleware(isLogged)
  async getBooks(@Ctx() ctx: Context): Promise<Book[]> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const books = await ctx.prisma.book.findMany({
      where: { authorId: author.id },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
          include: {
            tags: true,
          },
        },
        tags: true,
        comments: true,
      },
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
    const book = await ctx.prisma.book.findUnique({
      where: { id },
    });

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
