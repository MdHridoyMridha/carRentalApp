import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;

  private constructor() {
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://syxmqgpfmdjeucgbkoly.supabase.co';
    const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eG1xZ3BmbWRqZXVjZ2Jrb2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTczMjMsImV4cCI6MjA4OTczMzMyM30.m8zqwerweqmQRiEC3jPelWisd5lIq4dtqBWfyPAZyLk';

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables.');
    }

    this.client = createClient(supabaseUrl || '', supabaseAnonKey || '');
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public getClient(): SupabaseClient {
    return this.client;
  }
}

export default SupabaseService;
