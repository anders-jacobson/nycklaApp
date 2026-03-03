/**
 * Email sending utilities using Resend
 * https://resend.com/docs
 */

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('RESEND_API_KEY environment variable is required in production.');
  }
  console.warn('⚠️  RESEND_API_KEY not set — email sending will fail at runtime.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send invitation email to join organization
 */
export async function sendInvitationEmail(params: {
  to: string;
  organisationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `You've been invited to join ${params.organisationName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 16px 0; color: #1a1a1a;">You've been invited!</h2>
            <p style="margin: 0; font-size: 16px;">
              <strong>${params.inviterName}</strong> has invited you to join
              <strong>${params.organisationName}</strong> as a <strong>${params.role}</strong>.
            </p>
          </div>

          <div style="margin: 32px 0;">
            <a href="${params.inviteUrl}" 
               style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">This invitation will expire in <strong>7 days</strong>.</p>
            <p style="margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>

        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}
