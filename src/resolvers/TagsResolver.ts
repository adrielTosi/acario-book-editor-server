import { AuthenticationError, UserInputError } from "apollo-server-express";
import { Tag } from "../entities/Tag";
import { Context } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from "type-graphql";
import InputTags from "./inputs/InputTags";

@InputType()
class InputCreateTags {
  @Field(() => [InputTags])
  tags: InputTags[];

  @Field(() => String, { nullable: true })
  bookId?: string;

  @Field(() => String, { nullable: true })
  chapterId?: string;
}

@Resolver((_of) => Tag)
export class TagsResolver {
  /**
   * @CREATE_TAGS
   */
  @Mutation(() => [Tag])
  async createTags(
    @Arg("data") data: InputCreateTags,
    @Ctx() ctx: Context
  ): Promise<InputTags[]> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    // if it's adding tags to Book
    if (data.bookId) {
      const book = await ctx.prisma.book.findUnique({
        where: { id: data.bookId },
        include: { tags: true },
      });
      if (!book) {
        throw new UserInputError("Book doesn't exist.");
      }
      if (book.authorId !== author.id) {
        throw new AuthenticationError("Book is not yours.");
      }
      await ctx.prisma.tag.createMany({
        data: data.tags.map((tag) => ({
          label: tag.label,
          value: tag.value,
          bookId: book.id,
        })),
      });

      const tags = await ctx.prisma.tag.findMany({
        where: { bookId: book.id },
      });

      return tags;
      // If it's adding tags to chapter
    } else if (data.chapterId) {
      const chapter = await ctx.prisma.chapter.findUnique({
        where: { id: data.chapterId },
        include: { tags: true },
      });
      if (!chapter) {
        throw new UserInputError("Chapter doesn't exist.");
      }
      if (chapter.authorId !== author.id) {
        throw new AuthenticationError("Book is not yours.");
      }

      await ctx.prisma.tag.createMany({
        data: data.tags.map((tag) => ({
          label: tag.label,
          value: tag.value,
          chapterId: chapter.id,
        })),
      });
      const tags = await ctx.prisma.tag.findMany({
        where: { chapterId: data.chapterId },
      });

      return tags;
    } else {
      throw new UserInputError("Please provide Book or Chapter Id.");
    }
  }

  /**
   * @DELETE_TAG
   */
  // async deleteTag(@Arg("tagId") id: string, @Ctx() ctx: Context): Promise<boolean> {
  //   const author = await ctx.prisma.user.findUnique({
  //     where: { id: ctx.req.session.userId },
  //   });

  //   if (!author) {
  //     throw new AuthenticationError("Invalid user.");
  //   }

  //   const tag = await ctx.prisma.tag.findUnique({where: {id}})
  //   if(!tag) {
  //     throw new UserInputError("Tag dosn't exist or has been deleted.");
  //   }
  // }
}
