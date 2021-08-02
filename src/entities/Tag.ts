import { Length } from "class-validator";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Tag {
  @Field()
  id: string;

  @Field()
  label: string;

  @Field()
  @Length(0, 50)
  value: string;

  @Field(() => String, { nullable: true })
  bookId: string | null;

  @Field(() => String, { nullable: true })
  chapterId: string | null;

  // -------
  @Field(() => String)
  createdAt: Date;
}
