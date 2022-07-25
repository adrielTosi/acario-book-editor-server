import { Length } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import { Chapter } from "./Chapter";

@ObjectType()
export class Tag {
  @Field()
  id: number;

  @Field()
  label: string;

  @Field()
  @Length(0, 50)
  value: string;

  @Field(() => [Chapter])
  chapters: Chapter[];
}
