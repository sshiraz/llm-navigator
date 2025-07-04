import { supabase, handleSupabaseError, handleSupabaseSuccess } from '../lib/supabase';
import { Project } from '../types';

export class ProjectService {
  // Get all projects for a user
  static async getUserProjects(userId: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          competitors (*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Create a new project
  static async createProject(userId: string, projectData: {
    name: string;
    website: string;
    description?: string;
    keywords: string[];
  }) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          ...projectData
        })
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Update a project
  static async updateProject(projectId: string, updates: Partial<Project>) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Delete a project
  static async deleteProject(projectId: string) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Add competitor to project
  static async addCompetitor(projectId: string, competitorData: {
    name: string;
    website: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('competitors')
        .insert({
          project_id: projectId,
          ...competitorData
        })
        .select()
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(data);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }

  // Remove competitor from project
  static async removeCompetitor(competitorId: string) {
    try {
      const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', competitorId);

      if (error) {
        return handleSupabaseError(error);
      }

      return handleSupabaseSuccess(null);
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
}