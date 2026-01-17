import React, { useState, useEffect } from 'react';
import { Shield, Copy, CheckCircle, XCircle, AlertTriangle, Smartphone, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuditLogService } from '../../services/auditLogService';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onStatusChange: (enabled: boolean) => void;
}

interface TOTPFactor {
  id: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export default function TwoFactorSetup({ isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [totpFactor, setTotpFactor] = useState<TOTPFactor | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Check current 2FA status
  useEffect(() => {
    checkFactorStatus();
  }, []);

  const checkFactorStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error('Error checking MFA status:', error);
        return;
      }

      // Check if TOTP factor exists and is verified
      const verifiedTotpFactor = data.totp.find(f => f.status === 'verified');
      if (verifiedTotpFactor) {
        onStatusChange(true);
      }
    } catch (err) {
      console.error('Failed to check factor status:', err);
    }
  };

  const handleEnroll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Enroll a new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setTotpFactor(data as TOTPFactor);
        setShowSetup(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!totpFactor || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      // Verify the challenge
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) {
        setError('Invalid code. Please try again.');
        return;
      }

      // Success!
      AuditLogService.log2FAEnabled().catch(() => {});
      setSuccess('Two-factor authentication has been enabled!');
      onStatusChange(true);
      setShowSetup(false);
      setTotpFactor(null);
      setVerificationCode('');

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code to confirm');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get factors
      const { data: factorData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        setError(listError.message);
        return;
      }

      const verifiedFactor = factorData.totp.find(f => f.status === 'verified');
      if (!verifiedFactor) {
        setError('No verified 2FA factor found');
        return;
      }

      // Create a challenge to verify the user
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      // Verify the code first
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) {
        setError('Invalid code. Please try again.');
        return;
      }

      // Unenroll the factor
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });

      if (unenrollError) {
        setError(unenrollError.message);
        return;
      }

      // Success!
      AuditLogService.log2FADisabled().catch(() => {});
      setSuccess('Two-factor authentication has been disabled.');
      onStatusChange(false);
      setShowDisable(false);
      setVerificationCode('');

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (totpFactor?.totp.secret) {
      await navigator.clipboard.writeText(totpFactor.totp.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  const handleCancel = async () => {
    // If there's an unverified factor, unenroll it
    if (totpFactor) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      } catch (err) {
        console.error('Failed to cancel enrollment:', err);
      }
    }
    setShowSetup(false);
    setShowDisable(false);
    setTotpFactor(null);
    setVerificationCode('');
    setError(null);
  };

  // Success/Error messages
  if (success) {
    return (
      <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">{success}</span>
        </div>
      </div>
    );
  }

  // Disable 2FA flow
  if (showDisable) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-yellow-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Disable Two-Factor Authentication</span>
        </div>

        <p className="text-sm text-slate-400">
          Enter the 6-digit code from your authenticator app to confirm disabling 2FA.
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            maxLength={6}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDisable}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  // Setup 2FA flow
  if (showSetup && totpFactor) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400">
          <Smartphone className="w-5 h-5" />
          <span className="font-medium">Set Up Authenticator App</span>
        </div>

        <div className="bg-slate-900 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-4">
            1. Install an authenticator app like Google Authenticator, Authy, or 1Password
          </p>
          <p className="text-sm text-slate-400 mb-4">
            2. Scan this QR code with your authenticator app:
          </p>

          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg">
              <img
                src={totpFactor.totp.qr_code}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Manual entry option */}
          <div className="text-center mb-4">
            <p className="text-sm text-slate-500 mb-2">Or enter this code manually:</p>
            <div className="flex items-center justify-center space-x-2">
              <code className="bg-slate-800 px-3 py-2 rounded text-sm text-slate-300 font-mono">
                {totpFactor.totp.secret}
              </code>
              <button
                onClick={handleCopySecret}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                {secretCopied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            3. Enter the 6-digit code from your app:
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            maxLength={6}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Enable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  // Default view - show enable/disable button
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-green-900/50' : 'bg-slate-700'}`}>
            <Key className={`w-5 h-5 ${isEnabled ? 'text-green-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Two-Factor Authentication</h4>
            <p className="text-sm text-slate-400">
              {isEnabled ? 'Enabled - Your account has extra protection' : 'Add an extra layer of security'}
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-medium ${isEnabled ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        </div>
      )}

      {isEnabled ? (
        <button
          onClick={() => setShowDisable(true)}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-yellow-700 text-yellow-400 rounded-lg hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
        >
          Disable Two-Factor Authentication
        </button>
      ) : (
        <button
          onClick={handleEnroll}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Enable Two-Factor Authentication'}
        </button>
      )}

      <p className="text-xs text-slate-500">
        Two-factor authentication adds an extra layer of security by requiring a code from your
        authenticator app when signing in.
      </p>
    </div>
  );
}
