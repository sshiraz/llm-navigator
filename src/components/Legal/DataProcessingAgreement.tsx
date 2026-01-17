import React from 'react';
import { ArrowLeft, FileCheck, Download } from 'lucide-react';

export default function DataProcessingAgreement() {
  const goBack = () => {
    window.location.hash = 'dashboard';
  };

  const handleDownload = () => {
    // Create a text version for download
    const dpaText = `DATA PROCESSING AGREEMENT (DPA)

Last Updated: January 16, 2026

This Data Processing Agreement ("DPA") is entered into between:

- LLM Navigator ("Processor", "we", "us")
- The entity agreeing to these terms ("Controller", "you", "Customer")

1. DEFINITIONS

"Personal Data" means any information relating to an identified or identifiable natural person.
"Processing" means any operation performed on Personal Data.
"Sub-processor" means any third party engaged by the Processor to process Personal Data.
"Data Subject" means the individual to whom Personal Data relates.
"GDPR" means the General Data Protection Regulation (EU) 2016/679.
"CCPA" means the California Consumer Privacy Act.

2. SCOPE AND PURPOSE

2.1 This DPA applies to the processing of Personal Data by LLM Navigator on behalf of the Customer in connection with the Services.

2.2 The Customer acts as the Controller and LLM Navigator acts as the Processor of Personal Data.

2.3 The subject matter of processing is the provision of AEO (Answer Engine Optimization) analysis services.

3. CATEGORIES OF DATA PROCESSED

- Website URLs and content for analysis
- Business contact information (name, email, company)
- Usage data and analytics
- Payment information (processed by Stripe)

4. PROCESSING OBLIGATIONS

4.1 LLM Navigator shall:
(a) Process Personal Data only on documented instructions from the Customer
(b) Ensure personnel are bound by confidentiality obligations
(c) Implement appropriate technical and organizational security measures
(d) Assist the Customer in responding to Data Subject requests
(e) Delete or return Personal Data upon termination of services
(f) Make available information necessary to demonstrate compliance

4.2 LLM Navigator shall not:
(a) Process Personal Data for purposes other than providing the Services
(b) Sell Personal Data to third parties
(c) Transfer Personal Data outside the EEA without appropriate safeguards

5. SECURITY MEASURES

LLM Navigator implements the following security measures:
- Encryption of data in transit (TLS 1.3)
- Encryption of data at rest
- Access controls and authentication
- Regular security assessments
- Incident response procedures
- Employee security training

6. SUB-PROCESSORS

6.1 Current Sub-processors:
- Supabase (database hosting, authentication)
- Stripe (payment processing)
- Netlify (website hosting)
- OpenAI, Anthropic, Perplexity (AI analysis providers)

6.2 Customer authorizes the use of the above Sub-processors.

6.3 LLM Navigator will notify Customer of any intended changes to Sub-processors.

7. DATA SUBJECT RIGHTS

LLM Navigator will assist the Customer in fulfilling Data Subject requests for:
- Access to Personal Data
- Rectification of inaccurate data
- Erasure ("right to be forgotten")
- Data portability
- Restriction of processing
- Objection to processing

8. DATA BREACH NOTIFICATION

8.1 LLM Navigator will notify Customer without undue delay (within 72 hours) upon becoming aware of a Personal Data breach.

8.2 Notification will include:
- Nature of the breach
- Categories and number of Data Subjects affected
- Likely consequences
- Measures taken to address the breach

9. DATA RETENTION

- Active account data: Retained while account is active
- Fraud prevention data: 30-90 days
- Backups: 30 days
- Upon termination: Data deleted within 30 days

10. AUDIT RIGHTS

Customer may audit LLM Navigator's compliance with this DPA:
- Upon reasonable notice (30 days)
- During normal business hours
- At Customer's expense
- No more than once per year

11. LIABILITY

Each party's liability under this DPA is subject to the limitations set forth in the main Terms of Service.

12. TERM AND TERMINATION

This DPA remains in effect for the duration of the Services agreement. Upon termination, LLM Navigator will delete all Personal Data within 30 days unless retention is required by law.

13. GOVERNING LAW

This DPA is governed by the laws applicable to the main Terms of Service.

14. CONTACT

For questions about this DPA:
Email: privacy@llmnavigator.com

---
LLM Navigator
Data Processing Agreement v1.0
`;

    const blob = new Blob([dpaText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LLM-Navigator-DPA.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={goBack}
            className="inline-flex items-center space-x-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-900/50 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Data Processing Agreement</h1>
                <p className="text-slate-400 mt-1">
                  Last Updated: January 16, 2026
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download DPA</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enterprise Notice */}
        <div className="bg-indigo-900/30 border border-indigo-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-indigo-300 mb-2">For Enterprise Customers</h3>
          <p className="text-indigo-200">
            This DPA is automatically included with all Enterprise plans. If you require a custom DPA
            or have specific compliance requirements, please contact us at{' '}
            <a href="mailto:enterprise@llmnavigator.com" className="underline text-indigo-400 hover:text-indigo-300">
              enterprise@llmnavigator.com
            </a>
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8">
          <div className="prose prose-lg prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
            <h2>1. Definitions</h2>
            <ul>
              <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person.</li>
              <li><strong>"Processing"</strong> means any operation performed on Personal Data.</li>
              <li><strong>"Sub-processor"</strong> means any third party engaged by the Processor to process Personal Data.</li>
              <li><strong>"Data Subject"</strong> means the individual to whom Personal Data relates.</li>
              <li><strong>"GDPR"</strong> means the General Data Protection Regulation (EU) 2016/679.</li>
              <li><strong>"CCPA"</strong> means the California Consumer Privacy Act.</li>
            </ul>

            <h2>2. Scope and Purpose</h2>
            <p>
              This Data Processing Agreement ("DPA") applies to the processing of Personal Data by LLM Navigator
              on behalf of the Customer in connection with the Services. The Customer acts as the Controller
              and LLM Navigator acts as the Processor of Personal Data.
            </p>
            <p>
              The subject matter of processing is the provision of AEO (Answer Engine Optimization) analysis services,
              including website crawling, content analysis, and AI citation tracking.
            </p>

            <h2>3. Categories of Data Processed</h2>
            <ul>
              <li>Website URLs and publicly available content for analysis</li>
              <li>Business contact information (name, email, company name)</li>
              <li>Usage data and analytics</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>

            <h2>4. Processing Obligations</h2>
            <h3>4.1 LLM Navigator shall:</h3>
            <ul>
              <li>Process Personal Data only on documented instructions from the Customer</li>
              <li>Ensure personnel are bound by confidentiality obligations</li>
              <li>Implement appropriate technical and organizational security measures</li>
              <li>Assist the Customer in responding to Data Subject requests</li>
              <li>Delete or return Personal Data upon termination of services</li>
              <li>Make available information necessary to demonstrate compliance</li>
            </ul>

            <h3>4.2 LLM Navigator shall not:</h3>
            <ul>
              <li>Process Personal Data for purposes other than providing the Services</li>
              <li>Sell Personal Data to third parties</li>
              <li>Transfer Personal Data outside the EEA without appropriate safeguards</li>
            </ul>

            <h2>5. Security Measures</h2>
            <p>LLM Navigator implements the following security measures:</p>
            <ul>
              <li>Encryption of data in transit (TLS 1.3)</li>
              <li>Encryption of data at rest</li>
              <li>Access controls and authentication</li>
              <li>Regular security assessments</li>
              <li>Incident response procedures</li>
              <li>Employee security training</li>
            </ul>

            <h2>6. Sub-processors</h2>
            <p>LLM Navigator uses the following sub-processors:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 text-white">Sub-processor</th>
                    <th className="text-left py-2 text-white">Purpose</th>
                    <th className="text-left py-2 text-white">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  <tr>
                    <td className="py-2">Supabase</td>
                    <td className="py-2">Database hosting, authentication</td>
                    <td className="py-2">USA/EU</td>
                  </tr>
                  <tr>
                    <td className="py-2">Stripe</td>
                    <td className="py-2">Payment processing</td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr>
                    <td className="py-2">Netlify</td>
                    <td className="py-2">Website hosting</td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr>
                    <td className="py-2">OpenAI</td>
                    <td className="py-2">AI analysis</td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr>
                    <td className="py-2">Anthropic</td>
                    <td className="py-2">AI analysis</td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr>
                    <td className="py-2">Perplexity</td>
                    <td className="py-2">AI analysis</td>
                    <td className="py-2">USA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Customer authorizes the use of the above Sub-processors. LLM Navigator will notify
              Customer of any intended changes to Sub-processors with 30 days notice.
            </p>

            <h2>7. Data Subject Rights</h2>
            <p>LLM Navigator will assist the Customer in fulfilling Data Subject requests for:</p>
            <ul>
              <li>Access to Personal Data</li>
              <li>Rectification of inaccurate data</li>
              <li>Erasure ("right to be forgotten")</li>
              <li>Data portability</li>
              <li>Restriction of processing</li>
              <li>Objection to processing</li>
            </ul>

            <h2>8. Data Breach Notification</h2>
            <p>
              LLM Navigator will notify Customer without undue delay (within 72 hours) upon becoming
              aware of a Personal Data breach. Notification will include:
            </p>
            <ul>
              <li>Nature of the breach</li>
              <li>Categories and approximate number of Data Subjects affected</li>
              <li>Likely consequences of the breach</li>
              <li>Measures taken or proposed to address the breach</li>
            </ul>

            <h2>9. Data Retention</h2>
            <ul>
              <li><strong>Active account data:</strong> Retained while account is active</li>
              <li><strong>Fraud prevention data:</strong> IP addresses deleted after 30 days, fraud checks after 90 days</li>
              <li><strong>Backups:</strong> Retained for 30 days</li>
              <li><strong>Upon termination:</strong> Data deleted within 30 days unless retention required by law</li>
            </ul>

            <h2>10. Audit Rights</h2>
            <p>Customer may audit LLM Navigator's compliance with this DPA:</p>
            <ul>
              <li>Upon reasonable notice (30 days)</li>
              <li>During normal business hours</li>
              <li>At Customer's expense</li>
              <li>No more than once per calendar year</li>
            </ul>

            <h2>11. Liability</h2>
            <p>
              Each party's liability under this DPA is subject to the limitations set forth in the
              main Terms of Service agreement.
            </p>

            <h2>12. Term and Termination</h2>
            <p>
              This DPA remains in effect for the duration of the Services agreement. Upon termination,
              LLM Navigator will delete all Personal Data within 30 days unless retention is required by law.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              This DPA is governed by the laws applicable to the main Terms of Service agreement.
            </p>

            <h2>14. Contact</h2>
            <p>
              For questions about this DPA, please contact us at:{' '}
              <a href="mailto:privacy@llmnavigator.com">privacy@llmnavigator.com</a>
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-indigo-900/30 border border-indigo-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-indigo-300 mb-3">Related Documents</h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="#privacy"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Privacy Policy
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="#terms"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Terms of Service
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="#contact"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
