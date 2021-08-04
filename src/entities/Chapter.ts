import { Field, Int, ObjectType } from "type-graphql";
import { Comment } from "./Comment";
import { Tag } from "./Tag";

@ObjectType()
export class Chapter {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  text: string;

  @Field()
  chapterNumber: number;

  @Field(() => Int)
  likes: number;

  @Field(() => Int)
  dislikes: number;

  @Field()
  authorId: string;

  @Field()
  bookId: string;

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
