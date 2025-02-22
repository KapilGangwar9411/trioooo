// src/app/sign-in/sign-in.page.ts
import { Component, OnInit, NgZone } from '@angular/core';
import { MyEvent } from 'src/services/myevent.services';
import { Router } from '@angular/router';
import {
  NavController,
  AlertController,
  LoadingController,
} from '@ionic/angular';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  Auth,
} from 'firebase/auth';
import { auth } from '../../firebase-config';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit {
  countries: any[] = [];
  recaptchaVerifier!: RecaptchaVerifier;
  phoneNumber: string = '';
  testPhoneNumber: string = '+919934565896';
  testVerificationCode: string = '941186';
  isValidNumber: boolean = false;

  constructor(
    private myEvent: MyEvent,
    private route: Router,
    private navCtrl: NavController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private ngZone: NgZone
  ) {
    this.myEvent.getCountries().subscribe((res) => (this.countries = res));
  }

  async ngOnInit() {
    // Initialize reCAPTCHA verifier
    this.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      'sign-in-button',
      {
        size: 'invisible',
        callback: (response: any) => {
          // ReCAPTCHA solved, proceed with phone number authentication
          this.continue(this.phoneNumber);
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired. Clearing reCAPTCHA.');
          this.recaptchaVerifier.clear();
        },
      }
    );

    try {
      await this.recaptchaVerifier.render();
      console.log('reCAPTCHA rendered successfully.');
    } catch (error) {
      console.error('Error rendering reCAPTCHA:', error);
    }

    // Show popup asking about using the test phone number
    this.presentTestNumberAlert();
  }

  async presentTestNumberAlert() {
    const alert = await this.alertController.create({
      header: 'Demo Login',
      message: `Do you want to use the testing phone number ${this.testPhoneNumber}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes',
          handler: () => {
            this.ngZone.run(() => {
              this.phoneNumber = this.testPhoneNumber;
              this.isValidNumber = true; // Set valid for test number
            });
          },
        },
      ],
    });

    await alert.present();
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // Always return true for test number
    if (phoneNumber === this.testPhoneNumber) {
      return true;
    }

    // Remove any whitespace and special characters
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[-()+]/g, '');

    // Check if number starts with +91 and has 10 digits after that
    const indianNumberRegex = /^\+91[1-9][0-9]{9}$/;

    // For numbers without +91, check if it's 10 digits
    const tenDigitRegex = /^[1-9][0-9]{9}$/;

    return indianNumberRegex.test(phoneNumber) || tenDigitRegex.test(cleanNumber);
  }

  onPhoneNumberChange(event: any) {
    const number = event.target.value;

    // If it's the test number, don't modify it
    if (number === this.testPhoneNumber) {
      this.phoneNumber = number;
      this.isValidNumber = true;
      return;
    }

    // If number doesn't start with +91, add it
    if (number && !number.startsWith('+91')) {
      this.phoneNumber = '+91' + number;
    } else {
      this.phoneNumber = number;
    }

    this.isValidNumber = this.validatePhoneNumber(this.phoneNumber);
  }

  async continue(phoneNumber: string) {
    // Special handling for test number
    if (phoneNumber === this.testPhoneNumber) {
      localStorage.setItem('phoneNumber', phoneNumber);

      const loading = await this.loadingController.create({
        message: 'Sending OTP...',
      });
      await loading.present();

      // Simulate delay for demo
      setTimeout(async () => {
        await loading.dismiss();

        // Create mock confirmation result
        (window as any).confirmationResult = {
          verificationId: 'testVerificationId',
          confirm: (code: string) => {
            return new Promise((resolve, reject) => {
              if (code === this.testVerificationCode) {
                resolve({ user: { phoneNumber } });
              } else {
                reject(new Error('Invalid verification code'));
              }
            });
          }
        };

        this.route.navigate(['./verification']);
      }, 1000);

      return;
    }

    // Regular phone number validation
    if (!this.validatePhoneNumber(phoneNumber)) {
      const alert = await this.alertController.create({
        header: 'Invalid Number',
        message: 'Please enter a valid 10-digit mobile number',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Format the phone number if it doesn't have +91
    if (!phoneNumber.startsWith('+91')) {
      phoneNumber = '+91' + phoneNumber;
    }

    this.phoneNumber = phoneNumber;
    const appVerifier = this.recaptchaVerifier;

    localStorage.setItem('phoneNumber', phoneNumber);

    const loading = await this.loadingController.create({
      message: 'Sending OTP...',
    });
    await loading.present();

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      await loading.dismiss();

      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
      }

      (window as any).confirmationResult = confirmationResult;
      this.route.navigate(['./verification']);
    } catch (error: any) {
      await loading.dismiss();

      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
      }

      console.error('Error during signInWithPhoneNumber:', error);

      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'The phone number is invalid.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded. Please try again later.';
            break;
          case 'auth/too-many-requests':
            errorMessage =
              'Too many requests. Please wait and try again later.';
            break;
          case 'auth/missing-app-credential':
            errorMessage = 'App verification failed. Please try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'auth/app-not-authorized':
            errorMessage =
              'App not authorized. Please check your Firebase configuration.';
            break;
          case 'auth/missing-verification-code':
            errorMessage = 'Missing verification code.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage =
              'reCAPTCHA verification failed. Please try again.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        // User signed in.
        this.tabs();
      })
      .catch(async (error) => {
        console.error('Error during Google sign-in', error);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to sign in with Google. Please try again.',
          buttons: ['OK'],
        });
        await alert.present();
      });
  }

  signInWithFacebook() {
    const provider = new FacebookAuthProvider();
    signInWithPopup(auth, provider)
      .then(() => {
        // User signed in.
        this.tabs();
      })
      .catch(async (error) => {
        console.error('Error during Facebook sign-in', error);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to sign in with Facebook. Please try again.',
          buttons: ['OK'],
        });
        await alert.present();
      });
  }

  tabs() {
    this.navCtrl.navigateRoot(['./tabs']);
  }
}
