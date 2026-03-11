import 'server-only';

const requireServerEnvValue = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const emailConfig = {
  resendApiKey: requireServerEnvValue(process.env.RESEND_API_KEY, 'RESEND_API_KEY'),
  fromEmail: requireServerEnvValue(process.env.RESEND_FROM_EMAIL, 'RESEND_FROM_EMAIL'),
  appBaseUrl: requireServerEnvValue(process.env.APP_BASE_URL, 'APP_BASE_URL'),
};
