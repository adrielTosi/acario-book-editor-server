/*
  Warnings:

  - You are about to drop the column `commentId` on the `Reaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_commentId_fkey";

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "commentId";
