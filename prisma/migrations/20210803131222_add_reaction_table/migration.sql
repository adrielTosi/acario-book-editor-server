-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "bookId" TEXT,
    "chapterId" TEXT,
    "commentId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reaction" ADD FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
