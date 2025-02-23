import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { FirebaseService } from '../services/firebase.service';
import { UserProfile } from '../interfaces/user.interface';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.page.html',
  styleUrls: ['./my-profile.page.scss'],
})
export class MyProfilePage implements OnInit {
  segment: string = "0";
  userData: UserProfile = {};
  profileImageUrl: string = 'assets/images/profiles/user_profile.png';
  isLoading: boolean = false;

  constructor(
    private navCtrl: NavController,
    private supabaseService: SupabaseService,
    private firebaseService: FirebaseService,
    private loadingCtrl: LoadingController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    const auth = getAuth();
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.loadUserData();
      } else {
        console.log('No authenticated user');
        this.navCtrl.navigateRoot(['/sign-in']);
      }
    });
  }

  async loadUserData() {
    const loading = await this.showLoading('Loading profile...');
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      this.userData = await this.firebaseService.getUserProfile();
      if (this.userData.profileImageUrl) {
        this.profileImageUrl = this.userData.profileImageUrl;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.showToast('Error loading profile: ' + (error as Error).message);
    } finally {
      loading.dismiss();
    }
  }

  async updateProfile() {
    const loading = await this.showLoading('Updating profile...');
    try {
      // Validate email format
      if (this.userData.email && !this.isValidEmail(this.userData.email)) {
        this.showToast('Please enter a valid email address');
        return;
      }

      // Validate phone number
      if (this.userData.phone && !this.isValidPhone(this.userData.phone)) {
        this.showToast('Please enter a valid phone number');
        return;
      }

      // Save the profile
      await this.firebaseService.saveUserProfile(this.userData);

      // Reload the user data to ensure all views are updated
      await this.loadUserData();

      this.showToast('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showToast('Error updating profile');
    } finally {
      loading.dismiss();
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - modify according to your requirements
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    return phoneRegex.test(phone);
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const imageUrl = await this.supabaseService.uploadFile(file, 'profile-images');
        this.profileImageUrl = imageUrl;
        this.userData.profileImageUrl = imageUrl;
        await this.firebaseService.saveUserProfile(this.userData);
        this.showToast('Profile image updated successfully');
      } catch (error) {
        console.error('Error uploading file:', error);
        this.showToast('Error uploading image');
      }
    }
  }

  private async showLoading(message: string) {
    const loading = await this.loadingCtrl.create({
      message: message,
      spinner: 'bubbles'
    });
    await loading.present();
    return loading;
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  onSegmentChange(event: any) {
    const selectedIndex = event.detail.value;
    (<any>document.getElementById("swiper4")).swiper.slideTo(selectedIndex);
  }

  onSlideChange(event: any) {
    this.segment = `${(<any>document.getElementById("swiper4")).swiper.activeIndex}`;
  }

  logout() {
    const auth = getAuth();
    auth.signOut();
    this.navCtrl.navigateRoot(['./sign-in']);
  }
}

