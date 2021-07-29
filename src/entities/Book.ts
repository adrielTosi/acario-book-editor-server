import { Length } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import { Chapter } from "./Chapter";

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

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
