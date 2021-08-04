-- CreateTable
CREATE TABLE "ChapterReaction" (
    "authorId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "chapterId" TEXT NOT NULL,

    PRIMARY KEY ("authorId","chapterId")
);

-- AddForeignKey
ALTER TABLE "ChapterReaction" ADD FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterReaction" ADD FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
