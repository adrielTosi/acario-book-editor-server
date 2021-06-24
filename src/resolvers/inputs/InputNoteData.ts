import { InputType, Field } from "type-graphql";

@InputType()
class InputNoteData {
  @Field()
  title: string;

  @Field()
  text: string;

  @Field()
  bookId: string;

  @Field()
  chapterId: string;
}

export default InputNoteData;
