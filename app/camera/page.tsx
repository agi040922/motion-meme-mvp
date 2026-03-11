import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = {
  title: "Motion Meme - Camera Setup",
  description: "Check camera permissions and retry the setup flow before opening Play.",
};

export default async function CameraGuidePage() {
  await requireUser("/camera");
  redirect("/play");
}
