import { Field, ID, ObjectType } from "type-graphql";
import { Book } from "./Book";
import { Chapter } from "./Chapter";
import { Comment } from "./Comment";
import { Follow } from "./Follow";
import { Reaction } from "./Reaction";
import { Tag } from "./Tag";

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  password: string;

  @Field(() => [Book])
  books?: Book[];

  @Field(() => [Chapter])
  chapter?: Chapter[];

  @Field(() => [Tag])
  tags?: Tag[];

  @Field(() => [Follow])
  following?: Follow[];

  @Field(() => [Follow])
  followers?: Follow[];

  @Field(() => [Comment])
  comments?: Comment[];

  @Field(() => [Reaction])
  bookReactions?: Reaction[];

  @Field(() => [Reaction])
  chapterReactions?: Reaction[];

  // -------
  @Field(() => String)
  createdAt: Date;
}
