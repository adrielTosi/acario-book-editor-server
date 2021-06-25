import { Field, ObjectType } from "type-graphql";
import { Chapter } from "./Chapter";

@ObjectType()
export class Note {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  text: string;

  @Field()
  authorId: string;

  @Field()
  bookId: string;

  @Field()
  chapterId: string;

  @Field(() => Chapter, { nullable: true })
  chapter?: Chapter;

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
