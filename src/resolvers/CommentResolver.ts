import { Comment } from "../entities/Comment";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Context } from "../types";
import isLogged from "../middleware/isLogged";
import { AuthenticationError, UserInputError } from "apollo-server-express";

@InputType()
export class InputCreateComment {
  @Field()
  text: string;

  @Field(() => String, { nullable: true })
  bookId?: string;

  @Field(() => String, { nullable: true })
  chapterId?: string;
}

@Resolver((_of) => Comment)
export class CommentResolver {
  /**
   * @CREATE_COMMENT
   */
  @Mutation(() => Comment)
  @UseMiddleware(isLogged)
  async createComment(
    @Arg("data") data: InputCreateComment,
    @Ctx() ctx: Context
  ): Promise<Comment> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    // adding comment to book
    if (data.bookId) {
      const book = await ctx.prisma.book.findUnique({
        where: { id: data.bookId },
      });
      if (!book) {
        throw new UserInputError("Book doesn't exist.");
      }

      const comment = await ctx.prisma.comment.create({
        data: {
          text: data.text,
          authorId: author.id,
          bookId: book.id,
        },
      });
      return comment;
    } else if (data.chapterId) {
      const chapter = await ctx.prisma.chapter.findUnique({
        where: { id: data.chapterId },
      });
      if (!chapter) {
        throw new UserInputError("Chapter doesn't exist.");
      }

      const comment = await ctx.prisma.comment.create({
        data: {
          text: data.text,
          authorId: author.id,
          chapterId: chapter.id,
        },
      });
      return comment;
    } else {
      throw new UserInputError("Please provide Book or Chapter Id.");
    }
  }

  /**
   * @UPDATE_COMMENT
   */
  @Mutation(() => Comment)
  @UseMiddleware(isLogged)
  async updateComment(
    @Arg("id") id: string,
    @Arg("text") text: string,
    @Ctx() ctx: Context
  ): Promise<Comment> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const foundComment = await ctx.prisma.comment.findUnique({ where: { id } });
    if (!foundComment) {
      throw new UserInputError("Comment doesn't exist or has been deleted");
    }
    if (foundComment.authorId !== author.id) {
      throw new AuthenticationError("Comment is not yours");
    }

    const updatedComment = await ctx.prisma.comment.update({
      where: { id: foundComment.id },
      data: {
        text,
      },
    });

    return updatedComment;
  }

  /**
   * @DELETE_COMMENT
   */
  @Mutation(() => Boolean)
  @UseMiddleware(isLogged)
  async deleteComment(
    @Arg("id") id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const foundComment = await ctx.prisma.comment.findUnique({ where: { id } });
    if (!foundComment) {
      throw new UserInputError("Comment doesn't exist or has been deleted");
    }
    if (foundComment.authorId !== author.id) {
      throw new AuthenticationError("Comment is not yours");
    }

    await ctx.prisma.comment.delete({ where: { id: foundComment.id } });
    return true;
  }
}
