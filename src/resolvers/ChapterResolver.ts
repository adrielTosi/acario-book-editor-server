import { Chapter } from "../entities/Chapter";
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
import { Context } from "../types";
import { AuthenticationError, UserInputError } from "apollo-server-express";
import InputUpdateChapter, {
  TUpdateChapterData,
} from "./inputs/InputUpdateChapter";

@InputType()
class InputCreateChapter {
  @Field()
  title: string;

  @Field()
  bookId: string;

  @Field()
  text: string;
}

@Resolver((_of) => Chapter)
export class ChapterResolver {
  /**
   * @CREATE_CHAPTER
   */
  @Mutation(() => Chapter)
  @UseMiddleware(isLogged)
  async createChapter(
    @Arg("chapterData") data: InputCreateChapter,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    const book = await ctx.prisma.book.findUnique({
      where: { id: data.bookId },
    });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }

    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    if (book.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }
    const chapter = await ctx.prisma.chapter.create({
      data: {
        title: data.title,
        text: data.text,
        authorId: author.id,
        bookId: book.id,
      },
    });

    return chapter;
  }

  /**
   * @GET_CHAPTERS
   */
  @Query(() => [Chapter])
  @UseMiddleware(isLogged)
  async getChapters(
    @Arg("bookId") bookId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter[]> {
    const book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }

    const chapters = await ctx.prisma.chapter.findMany({ where: { bookId } });
    return chapters;
  }

  /**
   * @GET_CHAPTER
   */
  @Query(() => Chapter)
  @UseMiddleware(isLogged)
  async getChapter(
    @Arg("bookId") bookId: string,
    @Arg("chapterId") chapterId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
    const book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Chapter doesn't exist or has been deleted.");
    }
    return chapter;
  }

  /**
   * @UPDATE_CHAPTER
   * Begin with updating all the fields at all times,
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
    });
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
