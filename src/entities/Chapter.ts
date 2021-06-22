import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Chapter {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  text: string;

  @Field()
  authorId: string;

  @Field()
  bookId: string;

  // -------
  @Field(() => String)
  createdAt: Date;
}
