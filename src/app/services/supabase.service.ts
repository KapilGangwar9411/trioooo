import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  async uploadFile(file: File, userId: string, bucket: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${userId}.${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  private async createBucketIfNotExists(bucketName: string): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        throw listError;
      }

      if (!buckets?.some(b => b.name === bucketName)) {
        // Create bucket with public access
        const { error: createError } = await this.supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          throw createError;
        }

        // Set RLS policy
        const { error: policyError } = await this.supabase.rpc('create_storage_policy', {
          bucket_name: bucketName
        });

        if (policyError) {
          console.error('Error setting bucket policy:', policyError);
          throw policyError;
        }
      }
    } catch (error) {
      console.error('Error in createBucketIfNotExists:', error);
      throw error;
    }
  }

  async deleteFile(path: string, bucket: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw error;
    }
  }

  // Helper method to check if bucket exists
  async verifyBucket(bucket: string): Promise<boolean> {
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();

      if (error || !buckets) {
        console.error('Error verifying bucket:', error);
        return false;
      }

      const exists = buckets.some(b => b.name === bucket);
      console.log(`Bucket "${bucket}" exists:`, exists);
      return exists;
    } catch (error) {
      console.error('Error verifying bucket:', error);
      return false;
    }
  }
}
