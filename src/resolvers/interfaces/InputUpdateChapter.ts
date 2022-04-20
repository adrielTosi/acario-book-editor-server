import { Field, InputType } from "type-graphql";

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
}

export default InputUpdateChapter;
