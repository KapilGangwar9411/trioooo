import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { Address } from '../interfaces/address.interface';
import { LoadingController, AlertController, NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-manage-address',
  templateUrl: './manage-address.page.html',
  styleUrls: ['./manage-address.page.scss'],
})
export class ManageAddressPage implements OnInit, OnDestroy {
  addresses: Address[] = [];
  private addressSubscription: Subscription | undefined;
  isLoading = false;
  private authChecked = false;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private firebaseService: FirebaseService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  ngOnDestroy() {
    if (this.addressSubscription) {
      this.addressSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    if (this.authChecked) {
      this.loadAddresses();
    } else {
      this.checkAuthAndLoadData();
    }
  }

  private async checkAuthAndLoadData() {
    const auth = getAuth();
    if (!auth) {
      console.error('Firebase Auth not initialized');
      this.showToast('Authentication error');
      this.navCtrl.navigateRoot(['/sign-in']);
      return;
    }

    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Unsubscribe immediately after first callback
        this.authChecked = true;

        if (user) {
          console.log('User is authenticated:', user.uid);
          await this.loadAddresses();
        } else {
          console.log('No authenticated user');
          this.navCtrl.navigateRoot(['/sign-in']);
        }
        resolve();
      });
    });
  }

  private async loadAddresses() {
    if (this.isLoading) return;

    const loading = await this.loadingCtrl.create({
      message: 'Loading addresses...',
      spinner: 'bubbles'
    });

    try {
      this.isLoading = true;
      await loading.present();

      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      this.addresses = await this.firebaseService.getAddresses();
      console.log('Addresses loaded:', this.addresses);

      if (this.addresses.length === 0) {
        this.showToast('No saved addresses found');
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not authenticated')) {
        this.navCtrl.navigateRoot(['/sign-in']);
      } else {
        this.showToast('Failed to load addresses: ' + errorMessage);
      }
    } finally {
      this.isLoading = false;
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  add_address() {
    const auth = getAuth();
    if (!auth.currentUser) {
      this.showToast('Please sign in to add an address');
      this.navCtrl.navigateRoot(['/sign-in']);
      return;
    }
    this.navCtrl.navigateForward(['../add-address']);
  }

  async deleteAddress(addressId: string) {
    const auth = getAuth();
    if (!auth.currentUser) {
      this.showToast('Please sign in to delete addresses');
      this.navCtrl.navigateRoot(['/sign-in']);
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this address?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Deleting address...',
              spinner: 'bubbles'
            });
            await loading.present();

            try {
              await this.firebaseService.deleteAddress(addressId);
              await this.loadAddresses();
              this.showToast('Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              this.showToast('Failed to delete address: ' + (error as Error).message);
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getAddressIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'home':
        return 'zmdi zmdi-home';
      case 'office':
        return 'zmdi zmdi-city-alt';
      default:
        return 'zmdi zmdi-pin';
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: message.includes('Error') || message.includes('Failed') ? 'danger' : 'success'
    });
    await toast.present();
  }
}
