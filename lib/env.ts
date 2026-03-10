const requireEnvValue = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnvValue(
    supabaseUrl,
    "NEXT_PUBLIC_SUPABASE_URL",
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnvValue(
    supabaseAnonKey,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ),
};
