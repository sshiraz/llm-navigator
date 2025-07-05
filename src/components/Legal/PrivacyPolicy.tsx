import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={goBack}
            className="flex items-center space-x-2 text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Last Updated: May 15, 2025
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to LLM Navigator ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            <p>
              Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access our website or use our services.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>We may collect the following types of personal information:</p>
            <ul>
              <li><strong>Contact Information:</strong> Name, email address, phone number, and company name.</li>
              <li><strong>Account Information:</strong> Username, password, and account preferences.</li>
              <li><strong>Payment Information:</strong> Credit card details, billing address, and transaction history.</li>
              <li><strong>Usage Data:</strong> Information about how you use our website and services, including analytics data, website URLs analyzed, and keywords used.</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>When you visit our website, we automatically collect certain information, including:</p>
            <ul>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Operating system</li>
              <li>Referring website</li>
              <li>Pages visited and time spent on those pages</li>
              <li>Clickstream data</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul>
              <li>To provide and maintain our services</li>
              <li>To process payments and manage your account</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate with you about service updates, offers, and promotions</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To monitor and analyze usage patterns and trends</li>
              <li>To protect our services and prevent fraud</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Service Providers:</strong> Third-party vendors who help us provide our services (e.g., payment processors, cloud hosting providers).</li>
              <li><strong>Business Partners:</strong> Companies we partner with to offer integrated services.</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul>
              <li>Access and receive a copy of your personal information</li>
              <li>Rectify inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Restrict or object to processing of your information</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise these rights, please contact us using the information provided in the "Contact Us" section.</p>

            <h2>7. Cookies and Similar Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect and store information about your interactions with our website. You can control cookies through your browser settings and other tools. However, disabling cookies may limit your ability to use certain features of our website.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>

            <h2>9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We will take appropriate measures to ensure your information remains protected in accordance with this Privacy Policy.
            </p>

            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p>
              Email: privacy@llmnavigator.com<br />
              Address: 123 AI Avenue, Suite 400, San Francisco, CA 94107<br />
              Phone: +1 (800) 555-1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}