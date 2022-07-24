import isLogged from "../middleware/isLogged";
import { Arg, Ctx, Field, Mutation, ObjectType, Resolver, UseMiddleware } from "type-graphql";
import { Context } from "../types";
import { ApolloError, AuthenticationError, UserInputError } from "apollo-server-express";
import { Book } from "../entities/Book";
import { Chapter } from "../entities/Chapter";

@ObjectType()
export class BookReactionResponse {
  @Field({ description: "The book itself" })
  book: Book;

  @Field()
  hasVoted: boolean;
}
@ObjectType()
export class ChapterReactionResponse {
  @Field({ description: "The chapter itself" })
  chapter: Chapter;

  @Field()
  hasVoted: boolean;
}

@Resolver()
export class ReactionResolver {
  /**
   * @REACT_TO_BOOK
   * ? Do I need to return the whole book here?
   */
  @Mutation(() => BookReactionResponse)
  @UseMiddleware(isLogged)
  async reactToBook(
    @Arg("id") bookId: number,
    @Arg("value") value: 1 | -1,
    @Ctx() ctx: Context
  ): Promise<BookReactionResponse> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const book = await ctx.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new UserInputError("Book doesn't exist");
    }

    const alreadyVoted = await ctx.prisma.bookReaction.findUnique({
      where: { authorId_bookId: { authorId: author.id, bookId: book.id } },
    });

    // * user liked
    if (value === 1) {
      // not voted yet - create reaction, increase likes from book
      if (!alreadyVoted) {
        const createReaction = ctx.prisma.bookReaction.create({
          data: { authorId: author.id, value: 1, bookId: book.id },
        });
        const updateBook = ctx.prisma.book.update({
          where: { id: book.id },
          data: { likes: { increment: 1 } },
        });

        const [_, updatedBook] = await ctx.prisma.$transaction([createReaction, updateBook]);
        if (!updatedBook) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { book: updatedBook, hasVoted: true };
      }
      // already voted - user is removing like - delete the like and subtract likes from book
      if (alreadyVoted?.value === 1) {
        const deleteReaction = ctx.prisma.bookReaction.delete({
          where: {
            authorId_bookId: {
              authorId: alreadyVoted.authorId,
              bookId: book.id,
            },
          },
        });
        const updateBook = ctx.prisma.book.update({
          where: { id: book.id },
          data: { likes: { decrement: 1 } },
        });

        const [_, updatedBook] = await ctx.prisma.$transaction([deleteReaction, updateBook]);
        if (!updatedBook) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { book: updatedBook, hasVoted: false };
      }
      // already voted - user is changing like to positive - update reaction, decrease dislike, increase like
      if (alreadyVoted?.value === -1) {
        const updateReaction = ctx.prisma.bookReaction.update({
          where: {
            authorId_bookId: {
              authorId: alreadyVoted.authorId,
              bookId: book.id,
            },
          },
          data: { value: 1 },
        });
        const updateBook = ctx.prisma.book.update({
          where: { id: book.id },
          data: { likes: { increment: 1 }, dislikes: { decrement: 1 } },
        });

        const [_, updatedBook] = await ctx.prisma.$transaction([updateReaction, updateBook]);
        if (!updatedBook) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { book: updatedBook, hasVoted: true };
      }
      // * user disliked
    } else if (value === -1) {
      // not voted yet - create reaction, decrease likes from book
      if (!alreadyVoted) {
        const createReaction = ctx.prisma.bookReaction.create({
          data: { authorId: author.id, value: -1, bookId: book.id },
        });
        const updateBook = ctx.prisma.book.update({
          where: { id: book.id },
          data: { dislikes: { increment: 1 } },
        });

        const [_, updatedBook] = await ctx.prisma.$transaction([createReaction, updateBook]);
        if (!updatedBook) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { book: updatedBook, hasVoted: true };
      }
      // already voted - user is removing like - delete the like and decrement dislikes from book
      if (alreadyVoted?.value === -1) {
        const deleteReaction = ctx.prisma.bookReaction.delete({
          where: {
            authorId_bookId: {
              authorId: alreadyVoted.authorId,
              bookId: book.id,
            },
          },
        });
        const updateBook = ctx.prisma.book.update({
          where: { id: book.id },
          data: { dislikes: { decrement: 1 } },
        });

        const [_, updatedBook] = await ctx.prisma.$transaction([deleteReaction, updateBook]);
        if (!updatedBook) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { book: updatedBook, hasVoted: false };
      }
      // already voted - user is changing like to negative - update reaction, increase dislike, decrease like
      if (alreadyVoted?.value === 1) {
        const updateReaction = ctx.prisma.bookReaction.update({
          where: {
            authorId_bookId: {
              authorId: alreadyVoted.authorId,
              bookId: book.id,
            },
          },
          data: { value: -1 },
        });
        const updatebook = ctx.prisma.book.update({
          where: { id: book.id },
          data: { likes: { decrement: 1 }, dislikes: { increment: 1 } },
        });

        const [_, updatedBook] = await ctx.prisma.$transaction([updateReaction, updatebook]);
        if (!updatedBook) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { book: updatedBook, hasVoted: true };
      }
    }

    throw new ApolloError("Something went wrong, please try again.");
  }

  /**
   * @REACT_TO_CHAPTER
   * ? Do I need to return the whole book here?
   */
  @Mutation(() => ChapterReactionResponse)
  @UseMiddleware(isLogged)
  async reactToChapter(
    @Arg("id") chapterId: number,
    @Arg("value") value: 1 | -1,
    @Ctx() ctx: Context
  ): Promise<ChapterReactionResponse> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Story doesn't exist");
    }

    const alreadyVoted = await ctx.prisma.chapterReaction.findUnique({
      where: {
        authorId_chapterId: { authorId: author.id, chapterId: chapter.id },
      },
    });

    if (value === 1) {
      // not voted yet - create reaction, increase likes from chapter
      if (!alreadyVoted) {
        const createReaction = ctx.prisma.chapterReaction.create({
          data: { authorId: author.id, value: 1, chapterId: chapter.id },
        });
        const updateChapter = ctx.prisma.chapter.update({
          include: {
            ...(ctx.req.session.userId && {
              reactions: {
                where: { authorId: ctx.req.session.userId },
              },
            }),
            comments: {
              include: {
                author: true,
              },
            },
            author: true,
          },
          where: { id: chapter.id },
          data: { likes: { increment: 1 } },
        });

        const [_, updatedChapter] = await ctx.prisma.$transaction([createReaction, updateChapter]);
        if (!updatedChapter) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { chapter: updatedChapter, hasVoted: true };
      }
      // already voted - user is removing like - delete the like and subtract likes from chapter
      if (alreadyVoted?.value === 1) {
        const deleteReaction = ctx.prisma.chapterReaction.delete({
          where: {
            authorId_chapterId: {
              authorId: alreadyVoted.authorId,
              chapterId: chapter.id,
            },
          },
        });
        const updateChapter = ctx.prisma.chapter.update({
          include: {
            ...(ctx.req.session.userId && {
              reactions: {
                where: { authorId: ctx.req.session.userId },
              },
            }),
            comments: {
              include: {
                author: true,
              },
            },
            author: true,
          },
          where: { id: chapter.id },
          data: { likes: { decrement: 1 } },
        });

        const [_, updatedChapter] = await ctx.prisma.$transaction([deleteReaction, updateChapter]);
        if (!updatedChapter) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { chapter: updatedChapter, hasVoted: false };
      }
      // already voted - user is changing like to positive - update reaction, decrease dislike, increase like
      if (alreadyVoted?.value === -1) {
        const updateReaction = ctx.prisma.chapterReaction.update({
          where: {
            authorId_chapterId: {
              authorId: alreadyVoted.authorId,
              chapterId: chapter.id,
            },
          },
          data: { value: 1 },
        });
        const updateChapter = ctx.prisma.chapter.update({
          include: {
            ...(ctx.req.session.userId && {
              reactions: {
                where: { authorId: ctx.req.session.userId },
              },
            }),
            comments: {
              include: {
                author: true,
              },
            },
            author: true,
          },
          where: { id: chapter.id },
          data: { likes: { increment: 1 }, dislikes: { decrement: 1 } },
        });

        const [_, updatedChapter] = await ctx.prisma.$transaction([updateReaction, updateChapter]);
        if (!updatedChapter) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { chapter: updatedChapter, hasVoted: true };
      }
      // * user disliked
    } else if (value === -1) {
      // not voted yet - create reaction, decrease likes from chapter
      if (!alreadyVoted) {
        const createReaction = ctx.prisma.chapterReaction.create({
          data: { authorId: author.id, value: -1, chapterId: chapter.id },
        });
        const updateChapter = ctx.prisma.chapter.update({
          include: {
            ...(ctx.req.session.userId && {
              reactions: {
                where: { authorId: ctx.req.session.userId },
              },
            }),
            comments: {
              include: {
                author: true,
              },
            },
            author: true,
          },
          where: { id: chapter.id },
          data: { dislikes: { increment: 1 } },
        });

        const [_, updatedChapter] = await ctx.prisma.$transaction([createReaction, updateChapter]);
        if (!updatedChapter) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { chapter: updatedChapter, hasVoted: true };
      }
      // already voted - user is removing like - delete the like and decrement dislikes from chapter
      if (alreadyVoted?.value === -1) {
        const deleteReaction = ctx.prisma.chapterReaction.delete({
          where: {
            authorId_chapterId: {
              authorId: alreadyVoted.authorId,
              chapterId: chapter.id,
            },
          },
        });
        const updateChapter = ctx.prisma.chapter.update({
          include: {
            ...(ctx.req.session.userId && {
              reactions: {
                where: { authorId: ctx.req.session.userId },
              },
            }),
            comments: {
              include: {
                author: true,
              },
            },
            author: true,
          },
          where: { id: chapter.id },
          data: { dislikes: { decrement: 1 } },
        });

        const [_, updatedChapter] = await ctx.prisma.$transaction([deleteReaction, updateChapter]);
        if (!updatedChapter) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { chapter: updatedChapter, hasVoted: false };
      }
      // already voted - user is changing like to negative - update reaction, increase dislike, decrease like
      if (alreadyVoted?.value === 1) {
        const updateReaction = ctx.prisma.chapterReaction.update({
          where: {
            authorId_chapterId: {
              authorId: alreadyVoted.authorId,
              chapterId: chapter.id,
            },
          },
          data: { value: -1 },
        });
        const updateChapter = ctx.prisma.chapter.update({
          include: {
            ...(ctx.req.session.userId && {
              reactions: {
                where: { authorId: ctx.req.session.userId },
              },
            }),
            comments: {
              include: {
                author: true,
              },
            },
            author: true,
          },
          where: { id: chapter.id },
          data: { likes: { decrement: 1 }, dislikes: { increment: 1 } },
        });

        const [_, updatedChapter] = await ctx.prisma.$transaction([updateReaction, updateChapter]);
        if (!updatedChapter) {
          throw new ApolloError("Something went wrong, refresh and try again.");
        }
        return { chapter: updatedChapter, hasVoted: true };
      }
    }
    throw new ApolloError("Something went wrong, please try again.");
  }
}
