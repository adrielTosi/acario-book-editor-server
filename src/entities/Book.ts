import { Length } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import { Chapter } from "./Chapter";
import { Comment } from "./Comment";
import { Tag } from "./Tag";

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

  @Field(() => [Comment])
  comments?: Comment[];

  @Field(() => [Tag], { nullable: true })
  tags?: Tag[];

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
