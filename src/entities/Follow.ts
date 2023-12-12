import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Follow {
  @Field()
  leaderId: number;

  @Field()
  followId: number;
}
