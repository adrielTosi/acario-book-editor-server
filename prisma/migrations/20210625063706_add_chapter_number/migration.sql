/*
  Warnings:

  - Added the required column `chapterNumber` to the `Chapter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "chapterNumber" INTEGER NOT NULL;
