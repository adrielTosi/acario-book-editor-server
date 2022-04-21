import { Field, ID, ObjectType } from "type-graphql";
import { Book } from "./Book";
import { Chapter } from "./Chapter";
import { Comment } from "./Comment";
import { Follow } from "./Follow";
import { BookReaction, ChapterReaction } from "./Reaction";
import { Tag } from "./Tag";
@ObjectType()
export class _Count {
  @Field(() => Number)
  chapters?: number;
}

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

  @Field()
  avatarType: string;

  @Field()
  avatarSeed: string;

  @Field()
  bio: string;

  @Field()
  numberOfFollowing: number;

  @Field()
  numberOfFollowers: number;

  @Field(() => _Count)
  _count?: _Count | null;

  @Field(() => [Book])
  books?: Book[];

  @Field(() => [Chapter])
  chapters?: Chapter[];

  @Field(() => [Tag])
  tags?: Tag[];

  @Field(() => [Follow])
  following?: Follow[];

  @Field(() => [Follow])
  followers?: Follow[];

  @Field(() => [Comment])
  comments?: Comment[];

  @Field(() => [BookReaction])
  bookReactions?: BookReaction[];

  @Field(() => [ChapterReaction])
  chapterReactions?: ChapterReaction[];

  // -------
  @Field(() => String)
  createdAt: Date;
}
