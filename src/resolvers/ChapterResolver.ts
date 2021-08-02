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
import InputTag from "./inputs/InputTags";

@InputType()
class InputCreateChapter {
  @Field()
  title: string;

  @Field()
  bookId: string;

  @Field()
  text: string;

  @Field(() => [InputTag], { nullable: true })
  tags?: InputTag[];
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
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const book = await ctx.prisma.book.findUnique({
      where: { id: data.bookId },
      include: { chapters: true },
    });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }
    if (book.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const totalNumberOfChapters = book.chapters.length;

    const chapter = await ctx.prisma.chapter.create({
      data: {
        title: data.title,
        text: data.text,
        authorId: author.id,
        bookId: book.id,
        chapterNumber: totalNumberOfChapters + 1,
        tags: data.tags
          ? {
              createMany: {
                data: data.tags.map((tag) => ({
                  label: tag.label,
                  value: tag.value,
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
  async getChapters(
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
    @Arg("bookId") bookId: string,
    @Arg("chapterId") chapterId: string,
    @Ctx() ctx: Context
  ): Promise<Chapter> {
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

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        tags: true,
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
