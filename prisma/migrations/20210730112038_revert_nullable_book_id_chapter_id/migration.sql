/*
  Warnings:

  - Made the column `bookId` on table `Tag` required. This step will fail if there are existing NULL values in that column.
  - Made the column `chapterId` on table `Tag` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "bookId" SET NOT NULL,
ALTER COLUMN "chapterId" SET NOT NULL;
