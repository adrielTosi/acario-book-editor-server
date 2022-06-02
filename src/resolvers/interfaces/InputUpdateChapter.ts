import { Field, InputType } from "type-graphql";
import InputTag from "./InputTags";

@InputType()
class InputUpdateChapter {
  @Field({ nullable: true })
  bookId?: string;

  @Field()
  chapterId: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  text?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [InputTag], { nullable: true })
  tags?: InputTag[];
}

export default InputUpdateChapter;
