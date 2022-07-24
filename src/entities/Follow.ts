import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Follow {
  @Field(() => ID)
  leaderId: number;

  @Field(() => ID)
  followId: number;
}
