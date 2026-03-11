import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { getPlayDashboardData, getPlayReferenceClip } from "@/features/meme/server";
import { PlayExperience } from "@/features/play/PlayExperience";

export const metadata = {
  title: "Motion Meme - Play",
  description: "Run the stage ladder, score your pose, and upload only when ready.",
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams?: {
    reference?: string;
  };
}) {
  const user = await requireUser("/play");
  const [dashboard, referenceClip] = await Promise.all([
    getPlayDashboardData(user.id),
    searchParams?.reference ? getPlayReferenceClip(searchParams.reference) : Promise.resolve(null),
  ]);

  if (!dashboard.profile.handle) {
    redirect("/auth/login?next=/play");
  }

  return <PlayExperience initialData={{ ...dashboard, referenceClip }} />;
}
