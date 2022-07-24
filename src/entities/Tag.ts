import { Length } from "class-validator";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Tag {
  @Field()
  id: number;

  @Field()
  label: string;

  @Field()
  @Length(0, 50)
  value: string;

  @Field(() => String, { nullable: true })
  bookId: number | null;

  @Field(() => String, { nullable: true })
  chapterId: number | null;

  // -------
  @Field(() => String)
  createdAt: Date;
}
