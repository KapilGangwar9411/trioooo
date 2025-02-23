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

  async uploadFile(file: File, bucketName: string): Promise<string> {
    try {
      const user = await this.supabase.auth.getUser();
      if (!user.data?.user) {
        throw new Error('User not authenticated');
      }

      await this.createBucketIfNotExists(bucketName);

      // Include user ID in the file path for uniqueness
      const filePath = `${user.data.user.id}/${file.name}`;

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // Retrieve the public URL for the uploaded file
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  private async createBucketIfNotExists(bucketName: string): Promise<void> {
    try {
      // List current buckets
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets();
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw listError;
      }

      const bucketExists = buckets?.some(b => b.name === bucketName);
      if (!bucketExists) {
        // Create the bucket with public access and file restrictions
        const { data, error: createError } = await this.supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'application/pdf']
        });
        if (createError) {
          console.error('Error creating bucket:', createError);
          throw createError;
        }
        // Setup storage policy for the bucket if needed
        await this.setupBucketPolicy(bucketName);
      }
    } catch (error) {
      console.error('Error in createBucketIfNotExists:', error);
      throw error;
    }
  }

  private async setupBucketPolicy(bucketName: string): Promise<void> {
    try {
      // Dummy call to enforce public access (if policy setup is needed)
      const { error } = await this.supabase.storage.from(bucketName).createSignedUrl('dummy.txt', 1);
      if (error && !error.message.includes('The resource was not found')) {
        throw error;
      }
    } catch (error) {
      console.error('Error setting up bucket policy:', error);
      throw error;
    }
  }

  async deleteFile(path: string, bucket: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw error;
    }
  }

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
