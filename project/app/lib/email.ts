import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'ApplyDay <noreply@applyday.vercel.app>'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your ApplyDay password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:20px;font-weight:700;color:#18181b;margin:0 0 8px">Reset your password</h2>
        <p style="color:#52525b;font-size:14px;margin:0 0 24px">
          We received a request to reset the password for your ApplyDay account.
          Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;
                  padding:12px 28px;border-radius:8px;text-decoration:none">
          Reset Password
        </a>
        <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0">
          If you didn't request this, you can safely ignore this email.
          <br>The link will expire automatically.
        </p>
      </div>
    `,
  })
}
