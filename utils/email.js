// utils/email.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = 'vivekv290100@gmail.com';

async function sendOTP(email, otp) {
    console.log("eeee",email);
    
  const to = process.env.NODE_ENV === 'production' ? email : email;

  try {
    // RESEND CALL
    const response = await resend.emails.send({
      from: '<anything>@solimdrelo.resend.app',
      to,
      subject: 'Your OTP for Verification',
      html: `
        <div style="font-family:Arial;text-align:center;padding:30px;background:#f9f9f9;border-radius:12px;">
          <h2 style="color:#004c3f;">Verify Your Account</h2>
          <p style="font-size:16px;">Your OTP is:</p>
          <h1 style="font-size:42px;color:#004c3f;letter-spacing:8px;margin:20px 0;">${otp}</h1>
          <p style="color:#666;font-size:14px;">Expires in 5 minutes</p>
          ${process.env.NODE_ENV !== 'production'
            ? `<p style="color:red;"><strong>DEV MODE: Sent to ${to} (original: ${email})</strong></p>`
            : ''}
        </div>
      `,
      text: `Your OTP is ${otp}. Expires in 5 minutes.`,
    });

    // LOG THE FULL RESPONSE
    console.log('Resend raw response:', JSON.stringify(response, null, 2));

    // Extract ID safely
    const emailId = response?.id || response?.data?.id || '(no ID)';
    console.log('OTP sent! ID:', emailId, 'To:', to);

    return { success: true, id: emailId, to };

  } catch (err) {
    console.error('Resend failed:', err.message || err);
    throw err;
  }
}

module.exports = { sendOTP };