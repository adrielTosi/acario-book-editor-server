import { InputType, Field } from "type-graphql";

@InputType()
export class InputTag {
  @Field()
  label: string;

  @Field()
  value: string;
}

export default InputTag;
