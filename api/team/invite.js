// Send team invitation email via Resend
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, inviterName, teamName, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TechNova <noreply@technova.surf>',
        to: [email],
        subject: `You've been invited to join ${teamName || 'TechNova'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0f172a; margin-bottom: 24px;">Team Invitation</h1>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hi there!
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>${inviterName || 'A team member'}</strong> has invited you to join
              <strong>${teamName || 'their team'}</strong> on TechNova as a <strong>${role || 'Member'}</strong>.
            </p>
            <div style="margin: 32px 0;">
              <a href="https://technova.surf/signup"
                 style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              If you don't have an account yet, you'll be prompted to create one.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">
              This invitation was sent by TechNova. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', response.status, data);
      return res.status(500).json({
        error: 'Failed to send invitation email',
        details: data
      });
    }

    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Email send error:', error.message || error);
    return res.status(500).json({ error: 'Failed to send invitation email' });
  }
}

