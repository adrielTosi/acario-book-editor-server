import { Field, ID, ObjectType } from "type-graphql";
import { User } from "./User";

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  text: string;

  @Field(() => User)
  author?: User;

  @Field()
  authorId: string;

  @Field(() => String, { nullable: true })
  bookId: string | null;

  @Field(() => String, { nullable: true })
  chapterId: string | null;

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
