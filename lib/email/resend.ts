import 'server-only';

import { Resend } from 'resend';
import { emailConfig } from '@/lib/email/config';

export const resend = new Resend(emailConfig.resendApiKey);
