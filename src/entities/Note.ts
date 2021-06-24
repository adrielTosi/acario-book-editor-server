import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Note {
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

  @Field()
  chapterId: string;

  // -------
  @Field(() => String)
  createdAt: Date;
  @Field(() => String)
  updatedAt: Date;
}
