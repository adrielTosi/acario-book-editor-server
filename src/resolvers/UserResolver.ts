import { User } from "../entities/User";
import { Context } from "../types";
import { Ctx, Query, Resolver } from "type-graphql";

@Resolver(User)
export class UserResolver {
  @Query(() => [User])
  async allUsers(@Ctx() ctx: Context) {
    return ctx.prisma.user.findMany();
  }
}
