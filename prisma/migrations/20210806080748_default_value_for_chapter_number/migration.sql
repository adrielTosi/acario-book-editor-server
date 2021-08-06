/*
  Warnings:

  - Made the column `chapterNumber` on table `Chapter` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Chapter" ALTER COLUMN "chapterNumber" SET NOT NULL,
ALTER COLUMN "chapterNumber" SET DEFAULT -1;
