import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { getPlayDashboardData } from "@/features/meme/server";
import { PlayExperience } from "@/features/play/PlayExperience";

export const metadata = {
  title: "Motion Meme - Play",
  description: "Run the stage ladder, score your pose, and upload only when ready.",
};

export default async function PlayPage() {
  const user = await requireUser("/play");
  const dashboard = await getPlayDashboardData(user.id);

  if (!dashboard.profile.handle) {
    redirect("/auth/login?next=/play");
  }

  return <PlayExperience initialData={dashboard} />;
}
