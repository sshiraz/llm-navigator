import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
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
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-slate-400 mt-1">
                Last Updated: January 16, 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-lg">
          <div className="space-y-6 text-slate-200 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="mb-3">
                Welcome to LLM Navigator ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access our website or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-slate-100 mb-2 mt-4">2.1 Personal Information</h3>
              <p className="mb-3">We may collect the following types of personal information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="font-semibold text-white">Contact Information:</span> Name, email address, phone number, and company name.</li>
                <li><span className="font-semibold text-white">Account Information:</span> Username, password, and account preferences.</li>
                <li><span className="font-semibold text-white">Payment Information:</span> Credit card details, billing address, and transaction history.</li>
                <li><span className="font-semibold text-white">Usage Data:</span> Information about how you use our website and services, including analytics data, website URLs analyzed, and keywords used.</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-100 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <p className="mb-3">When you visit our website, we automatically collect certain information, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Operating system</li>
                <li>Referring website</li>
                <li>Pages visited and time spent on those pages</li>
                <li>Clickstream data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="mb-3">We use your personal information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain our services</li>
                <li>To process payments and manage your account</li>
                <li>To improve and personalize your experience</li>
                <li>To communicate with you about service updates, offers, and promotions</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To monitor and analyze usage patterns and trends</li>
                <li>To protect our services and prevent fraud</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. How We Share Your Information</h2>
              <p className="mb-3">We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="font-semibold text-white">Service Providers:</span> Third-party vendors who help us provide our services (e.g., payment processors, cloud hosting providers).</li>
                <li><span className="font-semibold text-white">Business Partners:</span> Companies we partner with to offer integrated services.</li>
                <li><span className="font-semibold text-white">Legal Requirements:</span> When required by law or to protect our rights.</li>
                <li><span className="font-semibold text-white">Business Transfers:</span> In connection with a merger, acquisition, or sale of assets.</li>
              </ul>
              <p className="mt-3 font-semibold text-white">We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights (GDPR & CCPA)</h2>
              <p className="mb-4">We are committed to giving you control over your personal data. You have the following rights:</p>

              <h3 className="text-xl font-semibold text-slate-100 mb-2 mt-4">6.1 Right to Access & Data Portability</h3>
              <p className="mb-3">
                You can download a complete copy of your personal data at any time. Go to <span className="font-semibold text-white">Account Settings → Account Security & Privacy → Download My Data</span> to export your data in JSON format. This includes your profile, analyses, and projects.
              </p>

              <h3 className="text-xl font-semibold text-slate-100 mb-2 mt-4">6.2 Right to Deletion (Right to be Forgotten)</h3>
              <p className="mb-3">
                You can permanently delete your account and all associated data. Go to <span className="font-semibold text-white">Account Settings → Account Security & Privacy → Delete My Account</span>. This action is irreversible and will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Delete your profile and account information</li>
                <li>Delete all your analyses and reports</li>
                <li>Delete all your projects</li>
                <li>Cancel any active subscriptions</li>
                <li>Remove your data from our systems</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-100 mb-2 mt-4">6.3 Other Rights</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
                <li>Rectify inaccurate or incomplete information</li>
                <li>Restrict or object to processing of your information</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p>To exercise rights not available through self-service, contact us using the information in the "Contact Us" section.</p>

              <h3 className="text-xl font-semibold text-slate-100 mb-2 mt-4">6.4 California Residents (CCPA)</h3>
              <p>
                California residents have additional rights under the CCPA, including the right to know what personal information we collect and the right to opt-out of the sale of personal information. <span className="font-semibold text-white">We do not sell your personal information.</span>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Consent</h2>
              <p className="mb-3">
                We use cookies and similar tracking technologies to improve your experience and analyze site usage. When you first visit our website, you will see a cookie consent banner that allows you to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
                <li><span className="font-semibold text-white">Accept:</span> Allow cookies for analytics and improved experience</li>
                <li><span className="font-semibold text-white">Decline:</span> Only essential cookies will be used</li>
              </ul>
              <p>
                You can change your cookie preferences at any time through your browser settings. Disabling cookies may limit your ability to use certain features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
              <p className="mb-3">
                We retain your personal data only as long as necessary to provide our services and fulfill the purposes described in this policy. Our data retention practices include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="font-semibold text-white">Account data:</span> Retained while your account is active, deleted upon account deletion request</li>
                <li><span className="font-semibold text-white">Analyses and reports:</span> Retained while your account is active</li>
                <li><span className="font-semibold text-white">Fraud prevention data:</span> IP addresses and device fingerprints are automatically deleted after 30 days</li>
                <li><span className="font-semibold text-white">Fraud check records:</span> Automatically deleted after 90 days</li>
                <li><span className="font-semibold text-white">Payment records:</span> Retained as required by law for tax and accounting purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We will take appropriate measures to ensure your information remains protected in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p className="mb-3">
                If you have any questions or concerns about this Privacy Policy or our data practices, please email us at:
              </p>
              <p>
                Email: <a href="mailto:info@convologix.com" className="text-indigo-400 hover:text-indigo-300 underline">info@convologix.com</a>
              </p>
            </section>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-indigo-900/30 border border-indigo-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-indigo-300 mb-3">Manage Your Privacy</h3>
          <div className="flex flex-wrap gap-4">
            <a
              href="#account"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Export Your Data
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="#account"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Delete Your Account
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="#terms"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}