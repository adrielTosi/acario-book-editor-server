import { Book } from "@prisma/client";
import {
  ApolloError,
  AuthenticationError,
  UserInputError,
} from "apollo-server-express";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Chapter } from "../entities/Chapter";
import isLogged from "../middleware/isLogged";
import { Context } from "../types";
import InputTag from "./interfaces/InputTags";
import InputUpdateChapter from "./interfaces/InputUpdateChapter";
import { StatusEnum } from "./interfaces/Status.enum";

@InputType()
class InputCreateChapter {
  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  bookId?: string;

  @Field(() => String)
  status: string;

  @Field()
  text: string;

  @Field()
  description: string;

  @Field(() => [InputTag], { nullable: true })
  tags?: InputTag[];
}

registerEnumType(StatusEnum, {
  name: "ChapterStatus",
  description: "The status of the Tale",
});

@ObjectType()
export class PaginatedTimelineChapters {
  @Field(() => [Chapter])
  chapters: Chapter[];

  @Field()
  hasMore?: boolean;
}

@Resolver((_of) => Chapter)
export class ChapterResolver {
  /**
   * @GET
   * @TIMELINE_BOOKS
   */
  @Query(() => PaginatedTimelineChapters)
  @UseMiddleware(isLogged)
  async getTimelineChapters(
    @Arg("take") take: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, // a DateTime value
    @Ctx() ctx: Context
  ): Promise<PaginatedTimelineChapters> {
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

    const chapters = await ctx.prisma.chapter.findMany({
      take,
      where: {
        authorId: { in: user.following.map((follow) => follow.leaderId) },
        createdAt: cursor ? { lt: cursorDate } : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: true,
        tags: true,
        ...(ctx.req.session.userId && {
          reactions: {
            where: { authorId: ctx.req.session.userId },
          },
        }),
        book: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!chapters) {
      throw new ApolloError(
        "Something went wrong, please refresh and try again."
      );
    }

    let hasMore = true;
    if (chapters.length < take) hasMore = false;
    return { chapters, hasMore };
  }

  /**
   * @CREATE_CHAPTER
   */
  @Mutation(() => Chapter)
  @UseMiddleware(isLogged)
  async createChapter(
    @Arg("chapterData") data: InputCreateChapter,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    // for when chapters can be put into books
    let book:
      | (Book & {
          chapters: Chapter[];
        })
      | null = null;
    if (data.bookId) {
      book = await ctx.prisma.book.findUnique({
        where: { id: data.bookId },
        include: { chapters: true },
      });
    }

    if (book && book.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const totalNumberOfChapters = book?.chapters.length;

    const chapter = await ctx.prisma.chapter.create({
      data: {
        title: data.title,
        text: data.text,
        authorId: author.id,
        bookId: book ? book.id : undefined,
        chapterNumber: book ? totalNumberOfChapters! + 1 : undefined,
        description: data.description,
        status: data.status,
        tags: data.tags
          ? {
              createMany: {
                data: data.tags.map((tag) => ({
                  label: tag.label,
                  value: tag.value,
                  authorId: author.id,
                })),
              },
            }
          : undefined,
      },
      include: {
        tags: !!data.tags,
        author: true,
      },
    });

    return chapter;
  }

  /**
   * @GET_CHAPTERS_FROM_BOOK
   */
  @Query(() => [Chapter])
  @UseMiddleware(isLogged)
  async getChaptersFromBook(
    @Arg("bookId") bookId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter[]> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }
    const book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }
    if (book.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const chapters = await ctx.prisma.chapter.findMany({
      where: { bookId },
      orderBy: { chapterNumber: "asc" },
      include: {
        tags: true,
        comments: true,
      },
    });
    return chapters;
  }

  /**
   * @GET_CHAPTER
   */
  @Query(() => Chapter)
  // @UseMiddleware(isLogged)
  async getChapter(
    // @Arg("bookId", { nullable: true }) bookId: string,
    @Arg("chapterId") chapterId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    // const loggedUser = await ctx.prisma.user.findUnique({
    //   where: { id: ctx.req.session.userId || "" },
    // });

    // if (!author) {
    //   throw new AuthenticationError("Invalid user.");
    // }
    // let book: Book | null = null;
    // if (bookId) {
    //   book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    // }

    // if (book && book.authorId !== author.id) {
    //   throw new AuthenticationError("Book is not yours.");
    // }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        tags: true,
        comments: {
          include: {
            author: true,
          },
        },
        book: true,
        author: true,
        ...(ctx.req.session.userId && {
          reactions: {
            where: { authorId: ctx.req.session.userId },
          },
        }),
      },
    });
    if (!chapter) {
      throw new UserInputError("Story doesn't exist or has been deleted.");
    }
    return chapter;
  }

  /**
   * @GET_CHAPTERS_FROM_USER
   */
  @Query(() => [Chapter])
  async getChaptersFromUser(
    @Arg("username") username: string,
    @Ctx() ctx: Context
  ): Promise<Chapter[]> {
    const author = await ctx.prisma.user.findUnique({
      where: { username },
    });

    if (!author) {
      throw new AuthenticationError("User doesn't exist or has been deleted.");
    }

    const chapters = await ctx.prisma.chapter.findMany({
      where: { authorId: author.id },
      include: {
        tags: true,
        comments: { include: { author: true } },
        book: true,
        author: true,
        ...(ctx.req.session.userId && {
          reactions: {
            where: { authorId: ctx.req.session.userId },
          },
        }),
      },
    });

    return chapters;
  }

  /**
   * @UPDATE_CHAPTER
   */
  @Mutation(() => Chapter)
  @UseMiddleware(isLogged)
  async updateChapter(
    @Arg("chapterData") data: InputUpdateChapter,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    // const book = await ctx.prisma.book.findUnique({
    //   where: { id: data.bookId },
    // });
    // if (!book) {
    //   throw new UserInputError("Book doesn't exist or has been deleted.");
    // }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });
    if (!user) {
      throw new AuthenticationError("Invalid user.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: data.chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Chapter doesn't exist or has been deleted.");
    }
    if (chapter.authorId !== user.id) {
      throw new AuthenticationError("This story is not yours.");
    }

    const updateData = {
      title: data.title,
      text: data.text,
      description: data.description,
    };

    const updatedChapter = ctx.prisma.chapter.update({
      where: { id: data.chapterId },
      data: updateData,
      include: {
        tags: true,
      },
    });

    return updatedChapter;
  }

  /**
   *
   * @ADD_CHAPTER_TO_BOOK
   */
  @Mutation(() => Chapter)
  @UseMiddleware(isLogged)
  async addChapterToBook(
    @Arg("chapterId") chapterId: string,
    @Arg("bookId") bookId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    const book = await ctx.prisma.book.findUnique({
      where: { id: bookId },
      include: { chapters: true },
    });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Chapter doesn't exist or has been deleted.");
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });
    if (!user) {
      throw new AuthenticationError("Invalid user.");
    }
    if (book.authorId !== user.id || chapter.authorId !== user.id) {
      throw new AuthenticationError("Book or chapter is not yours.");
    }

    const chapterNumber = book.chapters.length;
    const updatedChapter = ctx.prisma.chapter.update({
      where: { id: chapter.id },
      data: { bookId: book.id, chapterNumber: chapterNumber + 1 },
      include: { book: true },
    });
    if (!updatedChapter) {
      throw new ApolloError("Something went wrogn, please try again.");
    }
    return updatedChapter;
  }

  /**
   * @DELETE_CHAPTER
   * TODO: should I return Chapter here after deletion?
   */
  @Mutation(() => Chapter)
  @UseMiddleware(isLogged)
  async deleteChapter(
    @Arg("chapterId") chapterId: string,
    // @Arg("bookId") bookId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    // const book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    // if (!book) {
    //   throw new UserInputError("Book doesn't exist or has been deleted.");
    // }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });
    if (!user) {
      throw new AuthenticationError("Invalid user.");
    }

    // if (book.authorId !== user.id) {
    //   throw new AuthenticationError("Book is not yours.");
    // }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Story doesn't exist or has been deleted.");
    }
    if (chapter.authorId !== user.id) {
      throw new AuthenticationError("This is not yours.");
    }

    const deleteReactions = ctx.prisma.chapterReaction.deleteMany({
      where: { chapterId: chapter.id },
    });
    const deleteComments = ctx.prisma.comment.deleteMany({
      where: { chapterId: chapter.id },
    });
    const deleteChapter = ctx.prisma.chapter.delete({
      where: { id: chapter.id },
    });

    try {
      await ctx.prisma.$transaction([
        deleteReactions,
        deleteComments,
        deleteChapter,
      ]);
    } catch {
      throw new ApolloError(
        "Something went wrong, please refresh and try again."
      );
    }
    return chapter;
  }

  /**
   * @CHANGE_STATUS
   */
  @Mutation(() => Chapter)
  @UseMiddleware(isLogged)
  async changeStatus(
    @Arg("newStatus", () => StatusEnum) newStatus: StatusEnum,
    @Arg("id") id: string,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!user) {
      throw new AuthenticationError("Please, login!");
    }

    const chapter = await ctx.prisma.chapter.findUnique({ where: { id } });

    if (!chapter) {
      throw new ApolloError("Tale does not exist or has been deleted!");
    }

    if (chapter.authorId !== user.id) {
      throw new AuthenticationError("This tale is not yours!");
    }

    if (chapter.status === newStatus.toString()) {
      throw new UserInputError("The tale is already with the new status!");
    }

    try {
      const updatedTale = await ctx.prisma.chapter.update({
        where: { id },
        data: {
          status: newStatus.toString(),
        },
      });
      return updatedTale;
    } catch (err) {
      throw new ApolloError(err.message);
    }
  }
}
