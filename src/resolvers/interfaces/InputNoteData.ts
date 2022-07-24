import { InputType, Field } from "type-graphql";

@InputType()
class InputNoteData {
  @Field()
  title: string;

  @Field()
  text: string;

  @Field()
  bookId: number;

  @Field()
  chapterId: number;
}

export default InputNoteData;
