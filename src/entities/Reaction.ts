import { Field, Int, ObjectType } from "type-graphql";
import { Book } from "./Book";
import { Chapter } from "./Chapter";
import { User } from "./User";

@ObjectType()
export class ChapterReaction {
  @Field(() => User)
  author?: User;

  @Field()
  authorId: number;

  @Field(() => Int)
  value: number;

  @Field(() => Chapter)
  chapter?: Chapter;

  @Field(() => String)
  chapterId: number;
}
@ObjectType()
export class BookReaction {
  @Field(() => User)
  author?: User;

  @Field()
  authorId: number;

  @Field(() => Int)
  value: number;

  @Field(() => Book)
  book?: Book;

  @Field(() => String)
  bookId: number;
}
