import { Field, ID, ObjectType } from "type-graphql";
import { User } from "./User";

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: number;

  @Field()
  text: string;

  @Field(() => User)
  author?: User;

  @Field()
  authorId: number;

  @Field(() => String, { nullable: true })
  bookId: number | null;

  @Field(() => String, { nullable: true })
  chapterId: number | null;

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
