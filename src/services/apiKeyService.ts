import { supabase } from '../lib/supabase';
import { ApiKey } from '../types';

/**
 * Service for managing API keys (Enterprise users only)
 */
export class ApiKeyService {
  /**
   * Generate a cryptographically secure random string
   */
  private static generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
  }

  /**
   * Hash a string using SHA-256
   */
  private static async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a new API key for a user
   * Returns the full key ONCE - it cannot be retrieved again
   */
  static async createApiKey(
    userId: string,
    name: string = 'Default'
  ): Promise<{ success: boolean; key?: string; keyId?: string; prefix?: string; error?: string }> {
    try {
      // Generate the API key: llm_sk_{32 random chars}
      const randomPart = this.generateRandomString(32);
      const fullKey = `llm_sk_${randomPart}`;
      const keyPrefix = fullKey.substring(0, 12) + '...';

      // Hash the key for storage
      const keyHash = await this.hashKey(fullKey);

      // Insert into database
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          name: name,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        key: fullKey,      // Return full key ONCE
        keyId: data.id,
        prefix: keyPrefix,
      };
    } catch (error) {
      console.error('Error creating API key:', error);
      return { success: false, error: 'Failed to create API key' };
    }
  }

  /**
   * List all API keys for a user (without the actual key, just prefix)
   */
  static async listApiKeys(userId: string): Promise<{ success: boolean; keys?: ApiKey[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, user_id, key_prefix, name, last_used_at, created_at, revoked_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error listing API keys:', error);
        return { success: false, error: error.message };
      }

      const keys: ApiKey[] = (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        keyPrefix: row.key_prefix,
        name: row.name,
        lastUsedAt: row.last_used_at,
        createdAt: row.created_at,
        revokedAt: row.revoked_at,
      }));

      return { success: true, keys };
    } catch (error) {
      console.error('Error listing API keys:', error);
      return { success: false, error: 'Failed to list API keys' };
    }
  }

  /**
   * Revoke an API key (soft delete)
   */
  static async revokeApiKey(
    userId: string,
    keyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId)
        .eq('user_id', userId); // Ensure user owns this key

      if (error) {
        console.error('Error revoking API key:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error revoking API key:', error);
      return { success: false, error: 'Failed to revoke API key' };
    }
  }

  /**
   * Delete an API key permanently
   */
  static async deleteApiKey(
    userId: string,
    keyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', userId); // Ensure user owns this key

      if (error) {
        console.error('Error deleting API key:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return { success: false, error: 'Failed to delete API key' };
    }
  }

  /**
   * Update API key name
   */
  static async updateApiKeyName(
    userId: string,
    keyId: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ name })
        .eq('id', keyId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating API key:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating API key:', error);
      return { success: false, error: 'Failed to update API key' };
    }
  }
}
