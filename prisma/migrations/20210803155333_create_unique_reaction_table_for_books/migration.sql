/*
  Warnings:

  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_bookId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_chapterId_fkey";

-- DropTable
DROP TABLE "Reaction";

-- CreateTable
CREATE TABLE "BookReaction" (
    "authorId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,

    PRIMARY KEY ("authorId","bookId")
);

-- AddForeignKey
ALTER TABLE "BookReaction" ADD FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReaction" ADD FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
