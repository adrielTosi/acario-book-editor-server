/*
  Warnings:

  - You are about to drop the column `numberOfFollowers` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfFollowing` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "numberOfFollowers",
DROP COLUMN "numberOfFollowing";
