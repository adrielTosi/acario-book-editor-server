import { Length } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import { Chapter } from "./Chapter";
import { Note } from "./Note";

@ObjectType()
export class Book {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  @Length(0, 200)
  description: string;

  @Field()
  authorId: string;

  @Field(() => [Chapter])
  chapters: Chapter[];

  @Field(() => [Note], { nullable: true })
  notes?: Note[];

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
