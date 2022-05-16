-- AlterTable
ALTER TABLE "User" ALTER COLUMN "bio" SET DEFAULT E'Hello, check out my stories!';

-- CreateTable
CREATE TABLE "ReadLater" (
    "authorId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,

    PRIMARY KEY ("authorId","chapterId")
);

-- AddForeignKey
ALTER TABLE "ReadLater" ADD FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadLater" ADD FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
