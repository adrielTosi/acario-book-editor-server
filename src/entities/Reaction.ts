import { Field, ID, Int, ObjectType } from "type-graphql";

@ObjectType()
export class Reaction {
  @Field(() => ID)
  id: string;

  @Field()
  authorId: string;

  @Field(() => Int)
  value: 1 | -1;

  @Field(() => String, { nullable: true })
  bookId: string | null;

  @Field(() => String, { nullable: true })
  chapterId: string | null;
}
