import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeRedirectPath,
} from "@/lib/supabase/shared";
import { GradientMesh } from "@/components/ui/gradient-mesh";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = getSafeRedirectPath(
    searchParams?.next ?? DEFAULT_AUTH_REDIRECT_PATH,
  );
  const errorMessage = searchParams?.error;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left - Sign in */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image
                src="/favicon-32x32.png"
                alt="Motion Meme"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">
              Motion Meme
            </span>
          </div>
        </div>
        <div className="flex flex-1 w-full items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-sm text-zinc-500 text-balance">
                  Sign in with Google to start creating and sharing motion memes
                </p>
              </div>

              <GoogleSignInButton next={nextPath} />

              {errorMessage ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Right - Gradient mesh */}
      <div className="bg-zinc-100 relative hidden lg:block">
        <GradientMesh
          colors={["#bcecf6", "#00aaff", "#ffd447"]}
          distortion={8}
          swirl={0.2}
          speed={1}
          rotation={90}
          waveAmp={0.2}
          waveFreq={20}
          waveSpeed={0.2}
          grain={0.06}
        />
      </div>
    </div>
  );
}
