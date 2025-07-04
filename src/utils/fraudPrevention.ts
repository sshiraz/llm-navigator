// Fraud Prevention Utilities
export class FraudPrevention {
  private static readonly TRIAL_COOLDOWN_DAYS = 90; // 3 months between trials
  private static readonly MAX_TRIALS_PER_IP = 3;
  private static readonly EMAIL_SIMILARITY_THRESHOLD = 0.8;

  // Simulate checking against a database of previous trials
  private static previousTrials = [
    {
      email: 'john.doe@example.com',
      normalizedEmail: 'johndoe@example.com',
      deviceFingerprint: 'fp_abc123',
      ipAddress: '192.168.1.100',
      createdAt: '2024-01-01T10:00:00Z',
      domain: 'example.com'
    },
    {
      email: 'john.doe+test@example.com',
      normalizedEmail: 'johndoe@example.com',
      deviceFingerprint: 'fp_abc123',
      ipAddress: '192.168.1.100',
      createdAt: '2024-01-15T10:00:00Z',
      domain: 'example.com'
    }
  ];

  // Normalize email by removing dots, plus signs, and common variations
  static normalizeEmail(email: string): string {
    const [localPart, domain] = email.toLowerCase().split('@');
    
    // Remove dots and everything after + sign for Gmail-style addresses
    let normalizedLocal = localPart.replace(/\./g, '');
    const plusIndex = normalizedLocal.indexOf('+');
    if (plusIndex !== -1) {
      normalizedLocal = normalizedLocal.substring(0, plusIndex);
    }
    
    return `${normalizedLocal}@${domain}`;
  }

  // Generate device fingerprint (in real app, this would use canvas, WebGL, etc.)
  static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint test', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `fp_${Math.abs(hash).toString(36)}`;
  }

  // Get user's IP address (in real app, this would be done server-side)
  static async getUserIP(): Promise<string> {
    try {
      // In production, you'd use a service like ipify or get this server-side
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '127.0.0.1'; // Fallback for demo
    }
  }

  // Calculate email similarity using Levenshtein distance
  static calculateEmailSimilarity(email1: string, email2: string): number {
    const norm1 = this.normalizeEmail(email1);
    const norm2 = this.normalizeEmail(email2);
    
    if (norm1 === norm2) return 1.0;
    
    const matrix = Array(norm2.length + 1).fill(null).map(() => Array(norm1.length + 1).fill(null));
    
    for (let i = 0; i <= norm1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= norm2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= norm2.length; j++) {
      for (let i = 1; i <= norm1.length; i++) {
        const indicator = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const distance = matrix[norm2.length][norm1.length];
    const maxLength = Math.max(norm1.length, norm2.length);
    return 1 - (distance / maxLength);
  }

  // Check if trial signup is allowed
  static async checkTrialEligibility(email: string): Promise<FraudPreventionCheck> {
    const normalizedEmail = this.normalizeEmail(email);
    const deviceFingerprint = this.generateDeviceFingerprint();
    const ipAddress = await this.getUserIP();
    const domain = email.split('@')[1];
    
    let riskScore = 0;
    const checks = {
      emailSimilarity: true,
      deviceFingerprint: true,
      ipAddress: true,
      browserPattern: true,
      timePattern: true
    };

    // Check 1: Email similarity and normalization
    const similarEmails = this.previousTrials.filter(trial => {
      const similarity = this.calculateEmailSimilarity(email, trial.email);
      return similarity > this.EMAIL_SIMILARITY_THRESHOLD || trial.normalizedEmail === normalizedEmail;
    });

    if (similarEmails.length > 0) {
      const mostRecentSimilar = similarEmails.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      const daysSinceLastTrial = Math.floor(
        (Date.now() - new Date(mostRecentSimilar.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastTrial < this.TRIAL_COOLDOWN_DAYS) {
        checks.emailSimilarity = false;
        riskScore += 40;
      }
    }

    // Check 2: Device fingerprint
    const sameDeviceTrials = this.previousTrials.filter(trial => 
      trial.deviceFingerprint === deviceFingerprint
    );
    
    if (sameDeviceTrials.length >= 2) {
      checks.deviceFingerprint = false;
      riskScore += 30;
    }

    // Check 3: IP address
    const sameIPTrials = this.previousTrials.filter(trial => 
      trial.ipAddress === ipAddress
    );
    
    if (sameIPTrials.length >= this.MAX_TRIALS_PER_IP) {
      checks.ipAddress = false;
      riskScore += 25;
    }

    // Check 4: Disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
      'mailinator.com', 'throwaway.email', 'temp-mail.org'
    ];
    
    if (disposableDomains.includes(domain)) {
      checks.browserPattern = false;
      riskScore += 35;
    }

    // Check 5: Time pattern analysis (rapid signups)
    const recentTrials = this.previousTrials.filter(trial => {
      const hoursSince = (Date.now() - new Date(trial.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSince < 24 && (trial.ipAddress === ipAddress || trial.deviceFingerprint === deviceFingerprint);
    });

    if (recentTrials.length >= 3) {
      checks.timePattern = false;
      riskScore += 20;
    }

    // Determine if trial is allowed
    const isAllowed = riskScore < 50; // Threshold for blocking
    
    let reason = '';
    if (!isAllowed) {
      if (!checks.emailSimilarity) {
        reason = `You've recently used a trial with a similar email address. Please wait ${this.TRIAL_COOLDOWN_DAYS} days between trials.`;
      } else if (!checks.deviceFingerprint) {
        reason = 'Multiple trial attempts detected from this device. Please contact support if you need assistance.';
      } else if (!checks.ipAddress) {
        reason = 'Trial limit reached for this location. Please contact support for assistance.';
      } else if (!checks.browserPattern) {
        reason = 'Temporary email addresses are not allowed for trials. Please use a permanent email address.';
      } else if (!checks.timePattern) {
        reason = 'Too many recent trial attempts. Please wait 24 hours before trying again.';
      }
    }

    return {
      isAllowed,
      reason,
      riskScore,
      checks
    };
  }

  // Alternative trial options for blocked users
  static getAlternativeOptions(): string[] {
    return [
      'Start with our Free plan (1 analysis per month)',
      'Schedule a personalized demo with our team',
      'Contact sales for a custom evaluation',
      'Join our newsletter for exclusive offers'
    ];
  }

  // Add payment method requirement for higher-risk users
  static requiresPaymentMethod(riskScore: number): boolean {
    return riskScore > 25; // Require payment method for medium-risk users
  }
}