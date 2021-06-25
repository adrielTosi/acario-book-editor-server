import { AuthenticationError, UserInputError } from "apollo-server-express";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { Note } from "../entities/Note";
import isLogged from "../middleware/isLogged";
import { Context } from "../types";
import InputNoteData from "./inputs/InputNoteData";

@Resolver((_of) => Note)
export class NoteResolver {
  /**
   * @CREATE_NOTE
   */
  @Mutation(() => Note)
  @UseMiddleware(isLogged)
  async createNote(
    @Arg("noteData") data: InputNoteData,
    @Ctx() ctx: Context
  ): Promise<Note> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const book = await ctx.prisma.book.findUnique({
      where: { id: data.bookId },
    });
    if (!book) {
      throw new UserInputError("Book doesn't exist or has been deleted.");
    }

    if (book.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const chapter = await ctx.prisma.chapter.findUnique({
      where: { id: data.chapterId },
    });
    if (!chapter) {
      throw new UserInputError("Chapter doesn't exist or has been deleted.");
    }
    if (chapter.authorId !== author.id) {
      throw new AuthenticationError("Book is not yours.");
    }

    const note = await ctx.prisma.note.create({
      data: {
        text: data.text,
        title: data.title,
        authorId: author.id,
        bookId: book.id,
        chapterId: chapter.id,
      },
    });

    return note;
  }

  /**
   * @GET_NOTE
   */
  @Query(() => Note)
  @UseMiddleware(isLogged)
  async getNote(
    @Arg("noteId") noteId: string,
    @Ctx() ctx: Context
  ): Promise<Note> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const note = await ctx.prisma.note.findUnique({
      where: { id: noteId },
      include: { chapter: true },
    });
    if (!note) {
      throw new UserInputError("Note doesn't exist or has been deleted.");
    }
    if (note.authorId !== author.id) {
      throw new AuthenticationError("Note is now from one of your books.");
    }

    return note;
  }

  /**
   * @GET_NOTES
   * If `chapterId` is passed only notes from that chapter is returned, else all notes from book
   */
  @Query(() => [Note])
  @UseMiddleware(isLogged)
  async getNotes(
    @Arg("bookId") bookId: string,
    @Arg("chapterId", { nullable: true }) chapterId: string,
    @Ctx() ctx: Context
  ): Promise<Note[]> {
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

    const note = await ctx.prisma.note.findMany({
      where: chapterId ? { bookId, chapterId } : { bookId },
      include: { chapter: true },
    });
    if (!note) {
      throw new UserInputError("Note doesn't exist or has been deleted.");
    }

    return note;
  }

  /**
   * @DELETE_NOTE
   */
  @Mutation(() => Boolean)
  @UseMiddleware(isLogged)
  async deleteNote(
    @Arg("noteId") noteId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const note = await ctx.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new UserInputError("Note doesn't exist or has been deleted.");
    }

    if (note.authorId !== author.id) {
      throw new AuthenticationError("Note is not yours.");
    }

    await ctx.prisma.note.delete({ where: { id: noteId } });
    return true;
  }

  /**
   * @UPDATE_NOTE
   */
  @Mutation(() => Note)
  @UseMiddleware(isLogged)
  async updateNote(
    @Arg("noteId") noteId: string,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() ctx: Context
  ): Promise<Note> {
    const author = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!author) {
      throw new AuthenticationError("Invalid user.");
    }

    const note = await ctx.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new UserInputError("Note doesn't exist or has been deleted.");
    }

    if (note.authorId !== author.id) {
      throw new AuthenticationError("Note is not yours.");
    }

    const updatedNote = await ctx.prisma.note.update({
      where: { id: note.id },
      data: {
        title,
        text,
      },
    });

    return updatedNote;
  }
}
