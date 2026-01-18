import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightWithValidation, validateOrigin } from "../_shared/cors.ts";

interface CrawlSummary {
  pagesAnalyzed: number;
  totalWords: number;
  totalHeadings: number;
  totalSchemas: number;
  avgReadability: number;
  pages: { url: string; title: string; wordCount: number; schemaCount: number }[];
}

interface QueryResult {
  queryType: string;
  promptText: string;
  isCited: boolean;
  competitors: { domain: string }[];
}

interface FreeReportEmailRequest {
  email: string;
  website: string;
  reportData: {
    aiVisibilityScore: number;
    citationRate: number;
    totalQueries: number;
    citedQueries: number;
    industryCategory: string;
    competitorSummary: { domain: string; citationCount: number }[];
    recommendations: { priority: string; title: string; description: string }[];
    estimatedMissedTraffic: { monthly: number; yearly: number };
    crawlSummary?: CrawlSummary;
    queryResults?: QueryResult[];
  };
}

function generateEmailHtml(data: FreeReportEmailRequest): string {
  const { email, website, reportData } = data;
  const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  const scoreColor = reportData.aiVisibilityScore >= 60 ? '#22c55e' :
                     reportData.aiVisibilityScore >= 40 ? '#eab308' : '#ef4444';

  const citationColor = reportData.citationRate >= 40 ? '#22c55e' :
                        reportData.citationRate > 0 ? '#eab308' : '#ef4444';

  const competitorsList = reportData.competitorSummary.slice(0, 5)
    .map((c, i) => `<tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #334155;">${i + 1}. ${c.domain}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #334155; text-align: right;">${c.citationCount} citation${c.citationCount !== 1 ? 's' : ''}</td>
    </tr>`).join('');

  const crawlSummary = reportData.crawlSummary;
  const schemaColor = crawlSummary && crawlSummary.totalSchemas > 0 ? '#22c55e' : '#ef4444';
  const readabilityColor = crawlSummary && crawlSummary.avgReadability >= 60 ? '#22c55e' :
                          crawlSummary && crawlSummary.avgReadability >= 40 ? '#eab308' : '#ef4444';

  // Generate query-by-query results HTML
  const queryResults = reportData.queryResults || [];
  const queryResultsList = queryResults.map(q => {
    const statusColor = q.isCited ? '#22c55e' : '#ef4444';
    const statusText = q.isCited ? 'CITED' : 'NOT CITED';
    const competitorText = q.competitors.length > 0
      ? `<span style="color: #64748b; font-size: 12px;"> (${q.competitors.slice(0, 2).map(c => c.domain).join(', ')}${q.competitors.length > 2 ? '...' : ''})</span>`
      : '';
    return `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #334155;">
        <p style="margin: 0; color: #94a3b8; font-size: 11px; text-transform: uppercase;">${q.queryType}</p>
        <p style="margin: 4px 0 0 0; color: #f1f5f9; font-size: 13px;">${q.promptText}</p>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #334155; text-align: right; white-space: nowrap;">
        <span style="background-color: ${q.isCited ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${statusText}</span>
        ${competitorText}
      </td>
    </tr>`;
  }).join('');

  // Generate pages list HTML
  const pagesList = crawlSummary?.pages?.slice(0, 5).map((page, i) => {
    const schemaStatus = page.schemaCount > 0
      ? `<span style="color: #22c55e; font-size: 11px;">&#10003; ${page.schemaCount} schema</span>`
      : `<span style="color: #ef4444; font-size: 11px;">&#10007; No schema</span>`;
    return `<tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #334155;">
        <p style="margin: 0; color: #f1f5f9; font-size: 13px;">${page.title || page.url}</p>
        <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">${page.url}</p>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #334155; text-align: right;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">${page.wordCount.toLocaleString()} words</p>
        ${schemaStatus}
      </td>
    </tr>`;
  }).join('') || '';

  const recommendationsList = reportData.recommendations.slice(0, 3)
    .map(r => {
      const priorityColor = r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#eab308' : '#3b82f6';
      return `<div style="margin-bottom: 16px; padding-left: 12px; border-left: 3px solid ${priorityColor};">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: ${priorityColor}; text-transform: uppercase; font-weight: bold;">${r.priority} priority</p>
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #f1f5f9;">${r.title}</p>
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">${r.description}</p>
      </div>`;
    }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AI Visibility Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <h1 style="margin: 0; color: #f1f5f9; font-size: 24px;">LLM Search Insight</h1>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #1e293b; border-radius: 16px; padding: 32px;">

              <!-- Intro -->
              <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 14px;">Your AI Visibility Report for</p>
              <h2 style="color: #f1f5f9; margin: 0 0 24px 0; font-size: 20px;">${domain}</h2>

              <!-- Score Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="48%" style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px;">AI Visibility Score</p>
                    <p style="color: ${scoreColor}; margin: 0; font-size: 36px; font-weight: bold;">${reportData.aiVisibilityScore}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px;">Citation Rate</p>
                    <p style="color: ${citationColor}; margin: 0; font-size: 36px; font-weight: bold;">${reportData.citationRate}%</p>
                    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px;">${reportData.citedQueries}/${reportData.totalQueries} queries</p>
                  </td>
                </tr>
              </table>

              <!-- Missed Traffic Alert -->
              ${reportData.estimatedMissedTraffic.monthly > 0 ? `
              <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(249,115,22,0.1)); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #fb923c; margin: 0 0 8px 0; font-weight: 600;">Estimated Missed Traffic</p>
                <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                  You may be missing <strong style="color: #fb923c;">${reportData.estimatedMissedTraffic.monthly}</strong> visitors/month
                  (<strong style="color: #fb923c;">${reportData.estimatedMissedTraffic.yearly.toLocaleString()}</strong>/year) from AI search.
                </p>
              </div>
              ` : ''}

              <!-- Site Analysis -->
              ${crawlSummary ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #f1f5f9; margin: 0 0 12px 0; font-size: 16px;">Site Analysis (${crawlSummary.pagesAnalyzed} page${crawlSummary.pagesAnalyzed !== 1 ? 's' : ''} crawled)</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="24%" style="background-color: #0f172a; border-radius: 8px; padding: 12px; text-align: center;">
                      <p style="color: #f1f5f9; margin: 0; font-size: 18px; font-weight: bold;">${crawlSummary.totalWords.toLocaleString()}</p>
                      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px;">Words</p>
                    </td>
                    <td width="2%"></td>
                    <td width="24%" style="background-color: #0f172a; border-radius: 8px; padding: 12px; text-align: center;">
                      <p style="color: #f1f5f9; margin: 0; font-size: 18px; font-weight: bold;">${crawlSummary.totalHeadings}</p>
                      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px;">Headings</p>
                    </td>
                    <td width="2%"></td>
                    <td width="24%" style="background-color: #0f172a; border-radius: 8px; padding: 12px; text-align: center;">
                      <p style="color: ${schemaColor}; margin: 0; font-size: 18px; font-weight: bold;">${crawlSummary.totalSchemas}</p>
                      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px;">Schema</p>
                    </td>
                    <td width="2%"></td>
                    <td width="24%" style="background-color: #0f172a; border-radius: 8px; padding: 12px; text-align: center;">
                      <p style="color: ${readabilityColor}; margin: 0; font-size: 18px; font-weight: bold;">${Math.round(crawlSummary.avgReadability)}</p>
                      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px;">Readability</p>
                    </td>
                  </tr>
                </table>
              </div>
              ` : ''}

              <!-- Pages Analyzed -->
              ${pagesList ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #f1f5f9; margin: 0 0 12px 0; font-size: 16px;">Pages Analyzed</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 8px;">
                  ${pagesList}
                </table>
              </div>
              ` : ''}

              <!-- Query-by-Query Results -->
              ${queryResultsList ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #f1f5f9; margin: 0 0 12px 0; font-size: 16px;">Query-by-Query Results</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 8px;">
                  ${queryResultsList}
                </table>
              </div>
              ` : ''}

              <!-- Competitors -->
              ${reportData.competitorSummary.length > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #f1f5f9; margin: 0 0 12px 0; font-size: 16px;">Top Competitors Getting Cited</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 8px;">
                  ${competitorsList}
                </table>
              </div>
              ` : ''}

              <!-- Recommendations -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #f1f5f9; margin: 0 0 16px 0; font-size: 16px;">Your Action Plan</h3>
                ${recommendationsList}
              </div>

              <!-- CTA -->
              <div style="text-align: center; padding-top: 16px;">
                <a href="https://llmsearchinsight.com/#auth"
                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Start Free Trial - Get Full Analysis
                </a>
                <p style="color: #64748b; margin: 12px 0 0 0; font-size: 12px;">
                  Track across 3 AI providers, unlimited queries, competitor monitoring
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                You received this email because you requested a free AI visibility report.
              </p>
              <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">
                LLM Search Insight | AI Visibility Analytics
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
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

    const body: FreeReportEmailRequest = await req.json();
    const { email, website, reportData } = body;

    // Validate required fields
    if (!email || !website || !reportData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const htmlContent = generateEmailHtml(body);

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LLM Search Insight <reports@mail.llmsearchinsight.com>',
        to: [email],
        subject: `Your AI Visibility Report for ${domain}`,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const resendData = await resendResponse.json();
    console.log('Email sent successfully:', resendData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
