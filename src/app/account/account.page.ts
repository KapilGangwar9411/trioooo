import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG, AppConfig } from '../app.config';
import { NavController, ModalController } from '@ionic/angular';
import { BuyappalertPage } from '../buyappalert/buyappalert.page';
import { FirebaseService } from '../services/firebase.service';
import { UserProfile } from '../interfaces/user.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
})
export class AccountPage implements OnInit, OnDestroy {
  userData: UserProfile = {};
  profileImageUrl: string = 'assets/images/profiles/user_profile.png';
  private userSubscription: Subscription | undefined;

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private route: Router,
    private navCtrl: NavController,
    private modalController: ModalController,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit() {
    this.subscribeToUserProfile();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private subscribeToUserProfile() {
    this.userSubscription = this.firebaseService.getUserProfileUpdates().subscribe({
      next: (userData) => {
        if (userData) {
          this.userData = userData;
          this.profileImageUrl = userData.profileImageUrl || 'assets/images/profiles/user_profile.png';
        }
      },
      error: (error) => console.error('Profile subscription error:', error)
    });
  }

  my_profile() {
    this.route.navigate(['./my-profile']);
  }

  wallet() {
    this.route.navigate(['./wallet']);
  }

  manage_address() {
    this.route.navigate(['./manage-address']);
  }

  support() {
    this.route.navigate(['./support']);
  }

  privacy_policy() {
    this.route.navigate(['./privacy-policy']);
  }

  change_language() {
    this.route.navigate(['./language']);
  }

  faqs() {
    this.route.navigate(['./faq']);
  }

  logout() {
    this.navCtrl.navigateRoot(['./sign-in']);
  }

  developed_by() {
    window.open("https://opuslab.works/", '_system', 'location=no');
  }

  buyappalert() {
    this.modalController.create({ component: BuyappalertPage }).then((modalElement) => modalElement.present());
  }
}
