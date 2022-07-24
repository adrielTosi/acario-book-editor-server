import { ApolloError, AuthenticationError, UserInputError } from "apollo-server-express";
import { ReadLater } from "../entities/ReadLater";
import isLogged from "../middleware/isLogged";
import { Context } from "../types";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";

@ObjectType()
export class PaginatedReadLater {
  @Field(() => [ReadLater])
  readLater: ReadLater[];

  @Field()
  hasMore?: boolean;
}

@Resolver((_of) => ReadLater)
export class ReadLaterResolver {
  /**
   * @SAVE_CHAPTER
   */
  @Mutation(() => ReadLater)
  @UseMiddleware(isLogged)
  async saveChapterToReadLater(
    @Arg("id") chapterId: number,
    @Ctx() ctx: Context
  ): Promise<ReadLater> {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!user) {
      throw new AuthenticationError("Please, login to use this feature");
    }

    const chapterFound = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapterFound) {
      throw new UserInputError("This tale doesn't exist.");
    }

    const alreadySaved = await ctx.prisma.readLater.findUnique({
      where: {
        authorId_chapterId: { authorId: user.id, chapterId: chapterFound.id },
      },
    });

    if (alreadySaved) {
      throw new ApolloError("Already added to Read Later!");
    }

    const savedToLater = await ctx.prisma.readLater.create({
      data: {
        authorId: user.id,
        chapterId: chapterFound.id,
      },
      include: {
        chapter: {
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
        },
      },
    });

    if (!savedToLater) {
      throw new ApolloError("Something went wrong, please try again!");
    }

    return savedToLater;
  }
  /**
   * @GET_ALL_SAVED_CHAPTERS
   */
  @Query(() => PaginatedReadLater)
  @UseMiddleware(isLogged)
  async getAllSavedChapter(
    @Ctx() ctx: Context,
    @Arg("take") take: number,
    @Arg("offset") offset: number
  ): Promise<PaginatedReadLater> {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!user) {
      throw new AuthenticationError("Please, login to use this feature");
    }

    const savedChapters = await ctx.prisma.readLater.findMany({
      take,
      skip: offset,
      where: { authorId: user.id },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        chapter: {
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
        },
      },
    });

    if (!savedChapters) {
      throw new ApolloError("Something went wrong, please try again!");
    }

    let hasMore = true;
    if (savedChapters.length < take) hasMore = false;
    return {
      readLater: savedChapters,
      hasMore,
    };
  }

  /**
   * @DELETE_SAVED_CHAPTER
   */
  @Query(() => ReadLater)
  @UseMiddleware(isLogged)
  async removeFromReadLater(@Ctx() ctx: Context, @Arg("id") chapterId: number): Promise<ReadLater> {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!user) {
      throw new AuthenticationError("Please, login to use this feature");
    }

    const chapterFound = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapterFound) {
      throw new UserInputError("This tale doesn't exist.");
    }

    const alreadySaved = await ctx.prisma.readLater.findUnique({
      where: {
        authorId_chapterId: { authorId: user.id, chapterId: chapterFound.id },
      },
    });

    if (!alreadySaved) {
      throw new ApolloError("This is not on your Read Later anymore!");
    }

    const removed = await ctx.prisma.readLater.delete({
      where: {
        authorId_chapterId: { authorId: user.id, chapterId: chapterFound.id },
      },
    });

    if (!removed) {
      throw new ApolloError("Something went wrong, please try again!");
    }

    return removed;
  }
}
