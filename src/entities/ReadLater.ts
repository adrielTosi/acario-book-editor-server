import { ObjectType, Field } from "type-graphql";
import { Chapter } from "./Chapter";
import { User } from "./User";

@ObjectType()
export class ReadLater {
  @Field(() => User)
  author?: User;

  @Field()
  authorId: number;

  @Field(() => Chapter)
  chapter?: Chapter;

  @Field(() => String)
  chapterId: number;

  @Field(() => String)
  createdAt: Date;
}
