import { Field, ID, Int, ObjectType } from "type-graphql";
import { Book } from "./Book";
import { Chapter } from "./Chapter";
import { User } from "./User";

@ObjectType()
export class Reaction {
  @Field(() => ID)
  id: string;

  @Field()
  authorId: string;

  @Field(() => Int)
  value: 1 | -1;

  @Field(() => String, { nullable: true })
  bookId: string | null;

  @Field(() => String, { nullable: true })
  chapterId: string | null;
}

@ObjectType()
export class ChapterReaction {
  @Field(() => User)
  author?: User;

  @Field()
  authorId: string;

  @Field(() => Int)
  value: number;

  @Field(() => Chapter)
  chapter?: Chapter;

  @Field(() => String)
  chapterId: string;
}
@ObjectType()
export class BookReaction {
  @Field(() => User)
  author?: User;

  @Field()
  authorId: string;

  @Field(() => Int)
  value: number;

  @Field(() => Book)
  book?: Book;

  @Field(() => String)
  bookId: string;
}
