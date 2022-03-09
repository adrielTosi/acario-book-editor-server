-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "description" VARCHAR(400) NOT NULL DEFAULT E'';

-- AlterIndex
ALTER INDEX "User_email_key" RENAME TO "User.email_unique";

-- AlterIndex
ALTER INDEX "User_username_key" RENAME TO "User.username_unique";
