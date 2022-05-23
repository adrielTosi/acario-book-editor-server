import { Field, Int, ObjectType } from "type-graphql";
import { Book } from "./Book";
import { Comment } from "./Comment";
import { ChapterReaction } from "./Reaction";
import { Tag } from "./Tag";
import { User } from "./User";

@ObjectType()
export class Chapter {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  text: string;

  @Field()
  description: string;

  @Field()
  status: "draft" | "published" | string;

  @Field()
  chapterNumber: number;

  @Field(() => Int)
  likes: number;

  @Field(() => Int)
  dislikes: number;

  @Field()
  authorId: string;

  @Field(() => User)
  author?: User;

  @Field(() => String, { nullable: true })
  bookId: string | null;

  @Field(() => Book, { nullable: true })
  book?: Book | null;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  @Field(() => [ChapterReaction], { nullable: true })
  reactions?: ChapterReaction[];

  @Field(() => [Tag], { nullable: true })
  tags?: Tag[];

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
