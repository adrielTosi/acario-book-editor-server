import { Field, InputType } from "type-graphql";

@InputType()
class InputUpdateChapter {
  @Field()
  type: "update_title" | "update_text";

  @Field()
  bookId: string;

  @Field()
  chapterId: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  text?: string;
}

type TUpdateTitle = {
  title: string;
};

type TUpdateText = {
  text: string;
};

export type TUpdateChapterData = TUpdateTitle | TUpdateText;

export default InputUpdateChapter;
