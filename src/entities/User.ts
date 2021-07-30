import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field()
  password: string;

  // -------
  @Field(() => String)
  createdAt: Date;
}
