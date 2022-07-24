import InputTag from "src/resolvers/interfaces/InputTags";

export interface IGetTagsData {
  authorId: number;
  chapterId?: number;
  bookId?: number;
}

export const getTagsData = (tags: InputTag[], data: IGetTagsData) => {
  return tags.map((tag) => ({
    label: tag.label,
    value: tag.value,
    bookId: data.bookId,
    chapterId: data.chapterId,
    authorId: data.authorId,
  }));
};
