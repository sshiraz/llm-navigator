import React, { useState } from 'react';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle, Calendar, User, Building } from 'lucide-react';
import StripeCheckout from '../Payment/StripeCheckout';

interface CheckoutFormProps {
  selectedPlan: string;
  planPrice: number;
  onSuccess: (paymentData: any) => void;
  onCancel: () => void;
}

export default function CheckoutForm({ selectedPlan, planPrice, onSuccess, onCancel }: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Company Information
    company: '',
    website: '',
    
    // Billing Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Personal Information
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    // Billing Address
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateForm()) {
      setStep('payment');
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setIsProcessing(true);
    
    try {
      // Create user account with payment info
      const userData = {
        ...formData,
        plan: selectedPlan,
        paymentData,
        subscription: selectedPlan,
        paymentMethodAdded: true
      };
      
      // Simulate account creation
      setTimeout(() => {
        onSuccess(userData);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Account creation failed:', error);
      setIsProcessing(false);
    }
  };

  if (step === 'payment') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <button
            onClick={() => setStep('details')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Back to Details
          </button>
        </div>
        
        <StripeCheckout
          userId="temp_user_id" // This would be generated after account creation
          plan={selectedPlan}
          email={formData.email}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setStep('details')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Complete Your Purchase</h2>
            <p className="text-blue-100">
              {selectedPlan} Plan - ${planPrice}/month
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${planPrice}</div>
            <div className="text-blue-200 text-sm">per month</div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Error Message */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">Please fix the errors below</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Personal & Company Info */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john@company.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Company Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Corp"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://acme.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Billing Address */}
          <div className="space-y-6">
            {/* Billing Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123 Main Street"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="New York"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="NY"
                    />
                    {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.zipCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="10001"
                    />
                    {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{selectedPlan} Plan (Monthly)</span>
                  <span className="font-medium">${planPrice}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Setup Fee</span>
                  <span className="font-medium text-green-600">$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Today</span>
                    <span className="text-lg font-bold text-gray-900">${planPrice}.00</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Then ${planPrice}.00/month. Cancel anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900 mb-1">
                Secure Payment Processing
              </h4>
              <p className="text-sm text-green-800">
                Your payment information is encrypted and processed securely by Stripe. 
                We never store your credit card details on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleContinueToPayment}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center space-x-2"
          >
            <Lock className="w-5 h-5" />
            <span>Continue to Payment</span>
          </button>
        </div>

        {/* Terms */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          By completing this purchase, you agree to our Terms of Service and Privacy Policy. 
          Your subscription will automatically renew monthly until cancelled.
        </div>
      </div>
    </div>
  );
}