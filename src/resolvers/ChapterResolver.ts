import { Chapter } from "../entities/Chapter";
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
import isLogged from "../middleware/isLogged";
import { Context } from "../types";
import { ApolloError, AuthenticationError, UserInputError } from "apollo-server-express";
import InputUpdateChapter, { TUpdateChapterData } from "./inputs/InputUpdateChapter";
import InputTag from "./inputs/InputTags";
import { Book } from "@prisma/client";

@InputType()
class InputCreateChapter {
  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  bookId?: string;

  @Field()
  text: string;

  @Field(() => [InputTag], { nullable: true })
  tags?: InputTag[];
}

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
        authorId: { in: user.following.map((follow) => follow.followId) },
        createdAt: cursor ? { lt: cursorDate } : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: true,
        tags: true,
        reactions: true,
        book: true,
        comments: true,
      },
    });

    if (!chapters) {
      throw new ApolloError("Something went wrong, please refresh and try again.");
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
      },
    });

    return chapter;
  }

  /**
   * @GET_CHAPTERS
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
  @UseMiddleware(isLogged)
  async getChapter(
    @Arg("bookId", { nullable: true }) bookId: string,
    @Arg("chapterId") chapterId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }
    let book: Book | null = null;
    if (bookId) {
      book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    }

    if (book && book.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        tags: true,
        comments: true,
        book: true,
        author: true,
        reactions: true,
      },
    });
    if (!chapter) {
      throw new UserInputError("Chapter doesn't exist or has been deleted.");
    }
    return chapter;
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
    const book = await ctx.prisma.book.findUnique({
      where: { id: data.bookId },
    });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });
    if (!user) {
      throw new AuthenticationError("Invalid user.");
    }

    if (book.authorId !== user.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: data.chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Chapter doesn't exist or has been deleted.");
    }
    let updateData: TUpdateChapterData;
    if (data.type === "update_text") {
      updateData = {
        text: data.text!,
      };
    } else if (data.type === "update_title") {
      updateData = {
        title: data.title!,
      };
    }

    const updatedChapter = ctx.prisma.chapter.update({
      where: { id: data.chapterId },
      data: updateData!,
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
   */
  @Mutation(() => Boolean)
  @UseMiddleware(isLogged)
  async deleteChapter(
    @Arg("chapterId") chapterId: string,
    @Arg("bookId") bookId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });
    if (!user) {
      throw new AuthenticationError("Invalid user.");
    }

    if (book.authorId !== user.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Chapter doesn't exist or has been deleted.");
    }

    await ctx.prisma.chapter.delete({ where: { id: chapter.id } });
    return true;
  }
}
