import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Follow {
  @Field(() => ID)
  leaderId: string;

  @Field(() => ID)
  followId: string;
}
