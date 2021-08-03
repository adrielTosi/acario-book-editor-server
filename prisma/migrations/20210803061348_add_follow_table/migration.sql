-- CreateTable
CREATE TABLE "Follow" (
    "leaderId" TEXT NOT NULL,
    "followId" TEXT NOT NULL,

    PRIMARY KEY ("leaderId","followId")
);

-- AddForeignKey
ALTER TABLE "Follow" ADD FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD FOREIGN KEY ("followId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
