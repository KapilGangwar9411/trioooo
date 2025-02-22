// src/app/verification/verification.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.page.html',
  styleUrls: ['./verification.page.scss'],
})
export class VerificationPage implements OnInit {
  verificationCode: string = '';
  isTestNumber: boolean = false;
  testPhoneNumber: string = '+919934565896';
  testVerificationCode: string = '941186';

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Check if the test phone number was used
    const phoneNumber = localStorage.getItem('phoneNumber');

    if (!environment.production && phoneNumber === this.testPhoneNumber) {
      // Autofill the test OTP
      this.verificationCode = this.testVerificationCode;
      this.isTestNumber = true;
    }
  }

  async verifyCode() {
    const confirmationResult = (window as any).confirmationResult;
    if (confirmationResult) {
      confirmationResult
        .confirm(this.verificationCode)
        .then((result: any) => {
          // User signed in successfully.
          const user = result.user;
          console.log('User signed in:', user);

          // Clear localStorage
          localStorage.removeItem('phoneNumber');

          // Navigate to the main page
          this.router.navigate(['./tabs']);
        })
        .catch(async (error: any) => {
          console.error('Error while verifying code:', error);
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Invalid verification code. Please try again.',
            buttons: ['OK'],
          });
          await alert.present();
        });
    } else {
      console.error('No confirmation result found');
      const alert = await this.alertController.create({
        header: 'Error',
        message:
          'An error occurred. Please start the verification process again.',
        buttons: ['OK'],
      });
      await alert.present();
      this.router.navigate(['./sign-in']);
    }
  }
}
