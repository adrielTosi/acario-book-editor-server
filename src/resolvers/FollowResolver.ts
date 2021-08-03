import { AuthenticationError, UserInputError } from "apollo-server-express";
import isLogged from "../middleware/isLogged";
import { Context } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Follow } from "../entities/Follow";

@InputType()
export class InputFollow {
  @Field()
  followId: string;
}

@Resolver((_of) => Follow)
export class FollowResolver {
  /**
   * @FOLLOW_USER
   */
  @Mutation(() => Follow)
  @UseMiddleware(isLogged)
  async followUser(
    @Arg("data") data: InputFollow,
    @Ctx() ctx: Context
  ): Promise<InputFollow> {
    const leader = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!leader) {
      throw new AuthenticationError("Invalid user.");
    }

    const follow = await ctx.prisma.user.findUnique({
      where: { id: data.followId },
    });

    if (!follow) {
      throw new UserInputError(
        "The person you are trying to follow does not exist or has been deleted."
      );
    }
    if (leader.id === follow.id) {
      throw new UserInputError("You trying to follow yourself? That's low...");
    }

    const alreadyFollow = await ctx.prisma.follow.findUnique({
      where: {
        leaderId_followId: { leaderId: leader.id, followId: follow.id },
      },
    });
    if (alreadyFollow) {
      throw new UserInputError("You already follow this person.");
    }

    const followObject = await ctx.prisma.follow.create({
      data: { leaderId: leader.id, followId: follow.id },
    });
    return followObject;
  }

  /**
   * @UNFOLLOW_USER
   */
  @Mutation(() => Boolean)
  @UseMiddleware(isLogged)
  async unfollowUser(
    @Arg("data") data: InputFollow,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const leader = await ctx.prisma.user.findUnique({
      where: { id: ctx.req.session.userId },
    });

    if (!leader) {
      throw new AuthenticationError("Invalid user.");
    }

    const unfollow = await ctx.prisma.user.findUnique({
      where: { id: data.followId },
    });

    if (!unfollow) {
      throw new UserInputError(
        "The person you are trying to unfollow does not exist or has been deleted."
      );
    }
    if (leader.id === unfollow.id) {
      throw new UserInputError(
        "You trying to unfollow yourself? That should not be possible."
      );
    }

    const alreadyFollow = await ctx.prisma.follow.findUnique({
      where: {
        leaderId_followId: { leaderId: leader.id, followId: unfollow.id },
      },
    });
    if (!alreadyFollow) {
      throw new UserInputError("You don't follow this person.");
    }

    await ctx.prisma.follow.delete({
      where: {
        leaderId_followId: { leaderId: leader.id, followId: unfollow.id },
      },
    });
    return true;
  }
}
