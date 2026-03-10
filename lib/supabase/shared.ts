export const DEFAULT_AUTH_REDIRECT_PATH = "/feed";
export const AUTH_LOGIN_PATH = "/auth/login";

export const getSafeRedirectPath = (candidate?: string | null) => {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return candidate;
};
