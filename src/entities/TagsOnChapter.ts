import { Field, ID, ObjectType } from "type-graphql";
import { Chapter } from "./Chapter";
import { Tag } from "./Tag";

@ObjectType()
export class TagsOnChapters {
  @Field(() => ID)
  tagId: number;

  @Field(() => ID)
  chapterId: number;

  @Field(() => Tag, { nullable: true })
  tag?: Tag;

  @Field(() => Chapter, { nullable: true })
  chapter?: Chapter;
}
