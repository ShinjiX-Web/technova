// Send OTP email via Resend
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp, type } = req.body;

  console.log('📧 OTP email request:', { email, type, hasOtp: !!otp });

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  // Check if RESEND_API_KEY is configured
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
        subject: type === 'signup'
          ? 'Welcome to TechNova - Verify your email'
          : type === 'reset-password'
            ? 'TechNova - Reset your password'
            : 'TechNova - Your login verification code',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
              <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #18181b; font-size: 24px; margin: 0;">TechNova</h1>
                </div>

                <h2 style="color: #18181b; font-size: 20px; text-align: center; margin-bottom: 10px;">
                  ${type === 'signup' ? 'Verify your email' : type === 'reset-password' ? 'Reset your password' : 'Login verification'}
                </h2>

                <p style="color: #71717a; font-size: 14px; text-align: center; margin-bottom: 30px;">
                  ${type === 'signup'
                    ? 'Enter this code to complete your registration:'
                    : type === 'reset-password'
                      ? 'Enter this code to reset your password:'
                      : 'Enter this code to sign in to your account:'}
                </p>
                
                <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b;">${otp}</span>
                </div>
                
                <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                  This code expires in 10 minutes.<br>
                  If you didn't request this code, you can safely ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', response.status, data);
      // Return more detailed error for debugging
      const errorMessage = data.message || data.error || 'Failed to send email';
      return res.status(500).json({
        error: errorMessage,
        details: data,
        hint: response.status === 403
          ? 'Free tier can only send to your registered email. Add a custom domain in Resend to send to others.'
          : undefined
      });
    }

    console.log('✅ Email sent successfully:', data.id);
    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Email send error:', error.message || error);
    return res.status(500).json({ error: 'Failed to send email', message: error.message });
  }
}

