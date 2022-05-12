import { InputType, Field } from "type-graphql";

@InputType()
class InputUpdateProfile {
  @Field()
  name: string;

  @Field()
  avatarSeed: string;

  @Field()
  avatarType: string;

  @Field()
  bio: string;
}

export default InputUpdateProfile;
