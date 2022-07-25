import slugify from "slugify";

export const appSlugify = (value: string) => {
  return slugify(value, { lower: true });
};
