import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeAnimation from "./welcome-animation";

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarded_at) redirect("/");

  return (
    <WelcomeAnimation
      displayName={profile?.display_name ?? profile?.username ?? "Traveler"}
      passportNo={user.id.replace(/-/g, "").slice(0, 9).toUpperCase()}
    />
  );
}
