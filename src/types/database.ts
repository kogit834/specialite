export type Household = {
  id: string;
  name: string;
};

export type Profile = {
  id: string;
  display_name: string;
  household_id: string;
};

export type LabelGroup = {
  id: string;
  household_id: string;
  name: string;
  sort_order: number;
};

export type Label = {
  id: string;
  label_group_id: string;
  household_id: string;
  name: string;
  sort_order: number;
};

export type Recipe = {
  id: string;
  household_id: string;
  title: string;
  body: string;
  label_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type RecipePhoto = {
  id: string;
  recipe_id: string;
  storage_path: string;
  caption: string | null;
  taken_on: string | null;
  created_at: string;
};
