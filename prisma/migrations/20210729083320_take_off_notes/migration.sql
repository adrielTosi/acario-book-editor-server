/*
  Warnings:

  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_chapterId_fkey";

-- DropTable
DROP TABLE "Note";
