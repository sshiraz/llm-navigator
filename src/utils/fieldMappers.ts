// Field mapping utilities to handle naming inconsistencies between frontend and database
// Frontend uses camelCase, database uses snake_case

import { User } from '../types';

// Frontend User interface to Database User interface mapping
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription: 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';
  trial_ends_at?: string;
  device_fingerprint?: string;
  ip_address?: string;
  payment_method_added?: boolean;
  company_logo_url?: string;
  created_at: string;
  updated_at: string;
}

// Convert frontend User to database User
export function userToDatabase(user: User): DatabaseUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar,
    subscription: user.subscription,
    trial_ends_at: user.trialEndsAt,
    device_fingerprint: user.deviceFingerprint,
    ip_address: user.ipAddress,
    payment_method_added: user.paymentMethodAdded,
    company_logo_url: user.companyLogoUrl,
    created_at: user.createdAt,
    updated_at: new Date().toISOString() // Always update the updated_at field
  };
}

// Convert database User to frontend User
export function databaseToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatar: dbUser.avatar_url,
    subscription: dbUser.subscription,
    trialEndsAt: dbUser.trial_ends_at,
    deviceFingerprint: dbUser.device_fingerprint,
    ipAddress: dbUser.ip_address,
    paymentMethodAdded: dbUser.payment_method_added,
    companyLogoUrl: dbUser.company_logo_url,
    createdAt: dbUser.created_at
  };
}

// Partial update mapping for User
export function userUpdateToDatabase(updates: Partial<User>): Partial<DatabaseUser> {
  const dbUpdates: Partial<DatabaseUser> = {};

  if (updates.id !== undefined) dbUpdates.id = updates.id;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
  if (updates.subscription !== undefined) dbUpdates.subscription = updates.subscription;
  if (updates.trialEndsAt !== undefined) dbUpdates.trial_ends_at = updates.trialEndsAt;
  if (updates.deviceFingerprint !== undefined) dbUpdates.device_fingerprint = updates.deviceFingerprint;
  if (updates.ipAddress !== undefined) dbUpdates.ip_address = updates.ipAddress;
  if (updates.paymentMethodAdded !== undefined) dbUpdates.payment_method_added = updates.paymentMethodAdded;
  if (updates.companyLogoUrl !== undefined) dbUpdates.company_logo_url = updates.companyLogoUrl;

  // Always update the updated_at field when making changes
  dbUpdates.updated_at = new Date().toISOString();

  return dbUpdates;
}

// Generic field mapping utilities
export const fieldMappers = {
  // User field mappings
  user: {
    avatar: 'avatar_url',
    trialEndsAt: 'trial_ends_at',
    deviceFingerprint: 'device_fingerprint',
    ipAddress: 'ip_address',
    paymentMethodAdded: 'payment_method_added',
    companyLogoUrl: 'company_logo_url',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  
  // Analysis field mappings
  analysis: {
    projectId: 'project_id',
    userId: 'user_id',
    predictedRank: 'predicted_rank',
    isSimulated: 'is_simulated',
    costInfo: 'cost_info',
    createdAt: 'created_at'
  },
  
  // API Usage field mappings
  apiUsage: {
    userId: 'user_id',
    analysisId: 'analysis_id',
    errorCode: 'error_code'
  }
};

// Generic function to convert camelCase to snake_case
export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Generic function to convert snake_case to camelCase
export function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Generic object field mapper
export function mapObjectFields<T extends Record<string, any>>(
  obj: T,
  fieldMap: Record<string, string>,
  direction: 'toDatabase' | 'fromDatabase'
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      const mappedKey = direction === 'toDatabase' 
        ? fieldMap[key] || key 
        : Object.keys(fieldMap).find(k => fieldMap[k] === key) || key;
      result[mappedKey] = value;
    }
  }
  
  return result;
} 