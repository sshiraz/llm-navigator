import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate form
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Please fill out all required fields');
      }
      
      // Success
      setSubmitStatus('success');
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button 
            onClick={goBack}
            className="flex items-center space-x-2 text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Have questions about LLM Navigator? Our team is here to help you optimize your content for AI-powered search.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Email Us</h3>
                    <p className="text-gray-600 mt-1">Our team will respond within 24 hours</p>
                    <a href="mailto:support@llmnavigator.com" className="text-blue-600 hover:text-blue-800 font-medium mt-1 block">
                      support@llmnavigator.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Call Us</h3>
                    <p className="text-gray-600 mt-1">Mon-Fri from 9am to 5pm PST</p>
                    <a href="tel:+18005551234" className="text-blue-600 hover:text-blue-800 font-medium mt-1 block">
                      +1 (800) 555-1234
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 rounded-full p-3">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Visit Us</h3>
                    <p className="text-gray-600 mt-1">123 AI Avenue, Suite 400</p>
                    <p className="text-gray-600">San Francisco, CA 94107</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="bg-blue-400 text-white p-3 rounded-full hover:bg-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="bg-blue-700 text-white p-3 rounded-full hover:bg-blue-800 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="bg-blue-900 text-white p-3 rounded-full hover:bg-blue-950 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              
              {submitStatus === 'success' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Message Sent Successfully!</h3>
                  <p className="text-green-800 mb-6">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitStatus('idle')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-red-900">Error</h3>
                          <p className="text-sm text-red-800">{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a subject</option>
                        <option value="Sales Inquiry">Sales Inquiry</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Billing Question">Billing Question</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
                      I agree to the <a href="#privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</a> and consent to being contacted.
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What is LLM Navigator?</h3>
              <p className="text-gray-600">
                LLM Navigator is a platform that helps optimize your content for AI-powered search engines like ChatGPT, Claude, and Gemini. We analyze your website and provide actionable recommendations to improve your visibility in AI search results.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How does the free trial work?</h3>
              <p className="text-gray-600">
                Our 14-day free trial gives you full access to all features with no credit card required. You can run unlimited demo analyses and test all features before deciding on a subscription plan.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Do you offer refunds?</h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service. Simply contact our support team within 30 days of your purchase for a full refund.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I change plans later?</h3>
              <p className="text-gray-600">
                Absolutely! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades will apply at the end of your current billing cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}