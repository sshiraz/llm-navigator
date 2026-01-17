import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
  const goBack = () => {
    window.location.hash = 'dashboard';
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

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-indigo-900/50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
              <p className="text-slate-400 mt-1">
                Last Updated: January 16, 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8">
          <div className="prose prose-lg prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
            <h2>1. Agreement to Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you and LLM Navigator ("we," "our," or "us") governing your access to and use of our website, products, and services (collectively, the "Services").
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
            </p>

            <h2>2. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of any material changes by updating the "Last Updated" date at the top of these Terms. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.
            </p>

            <h2>3. Account Registration</h2>
            <p>
              To access certain features of our Services, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            <p>
              You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2>4. Subscription and Payment</h2>
            <h3>4.1 Subscription Plans</h3>
            <p>
              We offer various subscription plans with different features and pricing. The specific features included in each plan are described on our website.
            </p>

            <h3>4.2 Free Trial</h3>
            <p>
              We may offer a free trial period for our Services. At the end of the trial period, your account will automatically convert to a paid subscription unless you cancel before the trial ends.
            </p>

            <h3>4.3 Payment</h3>
            <p>
              By subscribing to our Services, you agree to pay all fees associated with your subscription plan. Payments are processed through our third-party payment processor, Stripe. You agree to provide accurate and complete payment information and authorize us to charge your payment method for all fees incurred.
            </p>

            <h3>4.4 Automatic Renewal</h3>
            <p>
              Subscriptions automatically renew at the end of each billing period unless canceled. You can cancel your subscription at any time through your account settings or by contacting our support team.
            </p>

            <h3>4.5 Refunds</h3>
            <p>
              We offer a 30-day money-back guarantee for new subscriptions. If you are not satisfied with our Services, you may request a refund within 30 days of your initial purchase. Refunds are processed at our discretion.
            </p>

            <h2>5. Acceptable Use</h2>
            <p>
              You agree not to use our Services for any purpose that is unlawful or prohibited by these Terms. You may not:
            </p>
            <ul>
              <li>Use the Services in any manner that could damage, disable, overburden, or impair our servers or networks</li>
              <li>Attempt to gain unauthorized access to any part of the Services</li>
              <li>Use automated means to access or collect data from the Services</li>
              <li>Use the Services to transmit any viruses, malware, or other harmful code</li>
              <li>Interfere with or disrupt the integrity or performance of the Services</li>
              <li>Harass, abuse, or harm another person through the Services</li>
              <li>Submit false or misleading information</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <h3>6.1 Our Intellectual Property</h3>
            <p>
              The Services and all content, features, and functionality thereof, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, software, and the design, selection, and arrangement thereof, are owned by us, our licensors, or other providers and are protected by copyright, trademark, patent, and other intellectual property laws.
            </p>

            <h3>6.2 License to Use</h3>
            <p>
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your personal or internal business purposes.
            </p>

            <h3>6.3 User Content</h3>
            <p>
              You retain ownership of any content you submit to the Services ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such User Content in connection with providing and promoting the Services.
            </p>

            <h2>7. Disclaimer of Warranties</h2>
            <p>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p>
              WE DO NOT GUARANTEE THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED. WE MAKE NO WARRANTY REGARDING THE QUALITY, ACCURACY, TIMELINESS, TRUTHFULNESS, COMPLETENESS, OR RELIABILITY OF ANY CONTENT AVAILABLE THROUGH THE SERVICES.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL WE OR OUR DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE THE SERVICES.
            </p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICES WILL NOT EXCEED THE AMOUNT PAID BY YOU TO US FOR THE SERVICES DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>

            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless us and our officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from or relating to:
            </p>
            <ul>
              <li>Your use of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another person or entity</li>
              <li>Your User Content</li>
            </ul>

            <h2>10. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Services at any time, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the Services will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including without limitation ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles. Any legal action or proceeding arising out of or relating to these Terms shall be brought exclusively in the federal or state courts located in San Francisco County, California.
            </p>

            <h2>12. Dispute Resolution</h2>
            <p>
              Any dispute arising from or relating to these Terms or the Services will first be resolved through good-faith negotiations. If such negotiations fail, the dispute shall be resolved through binding arbitration conducted by JAMS in San Francisco, California, in accordance with its Comprehensive Arbitration Rules and Procedures.
            </p>

            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the Terms will otherwise remain in full force and effect and enforceable.
            </p>

            <h2>14. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Services and supersede all prior agreements and understandings, whether written or oral.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please email us at:
            </p>
            <p>
              Email: <a href="mailto:info@convologix.com">info@convologix.com</a>
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
              href="#account"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Account Settings
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