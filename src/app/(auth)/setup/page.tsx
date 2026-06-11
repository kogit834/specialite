import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (profile?.household_id) redirect("/recipes");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <SetupForm userEmail={user.email ?? ""} />
    </div>
  );
}
