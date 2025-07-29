export type Params = Promise<{ slug: string }>;
export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export type ActionResponse = {
  success: boolean;
  message?: string;
};
export interface TaxonomyCategoryWithChildren {
  id: string;
  googleId: string;
  parentId: string | null;
  path: string | null;
  pathNames: string | null;
  depth: number;
  originalName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: TaxonomyCategoryWithChildren[];
}
