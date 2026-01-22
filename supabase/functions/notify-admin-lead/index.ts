import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";

interface NotifyAdminRequest {
  type: 'free_report' | 'signup';
  email: string;
  website?: string;
  aiScore?: number;
  citationRate?: number;
  industry?: string;
  name?: string;
}

function generateEmailHtml(data: NotifyAdminRequest): string {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  if (data.type === 'free_report') {
    const scoreColor = (data.aiScore || 0) >= 60 ? '#22c55e' :
                       (data.aiScore || 0) >= 40 ? '#eab308' : '#ef4444';
    const citationColor = (data.citationRate || 0) >= 40 ? '#22c55e' :
                          (data.citationRate || 0) > 0 ? '#eab308' : '#ef4444';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; color: white; font-size: 20px;">New Free Report Lead</h1>
      <p style="margin: 5px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${timestamp}</p>
    </div>

    <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Website</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">
            <a href="${data.website?.startsWith('http') ? data.website : `https://${data.website}`}" style="color: #3b82f6; text-decoration: none;">${data.website}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">AI Score</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: ${scoreColor};">${data.aiScore || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Citation Rate</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: ${citationColor};">${data.citationRate ? `${Math.round(data.citationRate)}%` : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Industry</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${data.industry || 'N/A'}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <a href="https://llmsearchinsight.com/#admin-leads" style="display: block; text-align: center; background: #3b82f6; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">View All Leads</a>
      </div>
    </div>
  </div>
</body>
</html>`;
  } else {
    // Signup notification
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #22c55e, #10b981); padding: 20px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; color: white; font-size: 20px;">New Account Signup</h1>
      <p style="margin: 5px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">${timestamp}</p>
    </div>

    <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Name</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${data.name || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
          <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${data.email}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <a href="https://llmsearchinsight.com/#admin-signups" style="display: block; text-align: center; background: #22c55e; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">View All Signups</a>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightWithValidation(req);
  if (preflightResponse) return preflightResponse;

  // Validate origin
  const originError = validateOrigin(req);
  if (originError) return originError;

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const body: NotifyAdminRequest = await req.json();

    if (!body.email || !body.type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: email and type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const subject = body.type === 'free_report'
      ? `New Free Report Lead: ${body.email}`
      : `New Account Signup: ${body.email}`;

    const htmlContent = generateEmailHtml(body);

    console.log(`Sending admin notification for ${body.type}: ${body.email}`);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LLM Navigator <reports@mail.llmsearchinsight.com>',
        to: ['info@convologix.com'],
        subject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send notification email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const resendData = await resendResponse.json();
    console.log(`Admin notification sent successfully. Email ID: ${resendData.id}`);

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in notify-admin-lead:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
