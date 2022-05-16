import { ObjectType, Field } from "type-graphql";
import { Chapter } from "./Chapter";
import { User } from "./User";

@ObjectType()
export class ReadLater {
  @Field(() => User)
  author?: User;

  @Field()
  authorId: string;

  @Field(() => Chapter)
  chapter?: Chapter;

  @Field(() => String)
  chapterId: string;

  @Field(() => String)
  createdAt: Date;
}
