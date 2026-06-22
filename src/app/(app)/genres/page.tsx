import { redirect } from "next/navigation";

export default function GenresPage() {
  redirect("/settings?tab=labels");
}
