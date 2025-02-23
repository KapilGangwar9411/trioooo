import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { NavController, LoadingController, ToastController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service';
import { Address } from '../interfaces/address.interface';

declare var google: any;

@Component({
  selector: 'app-add-address',
  templateUrl: './add-address.page.html',
  styleUrls: ['./add-address.page.scss'],
})
export class AddAddressPage implements OnInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;

  map: any;
  marker: any;
  geocoder: any;
  fabAction = false;
  isLoading = false;

  address: Address = {
    type: 'home',
    address: '',
    landmark: '',
    latitude: 0,
    longitude: 0
  };

  constructor(
    private navCtrl: NavController,
    private firebaseService: FirebaseService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    await this.initMap();
  }

  private async initMap() {
    this.isLoading = true;
    try {
      const position = await this.getCurrentPosition();
      const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };

      const mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true
      };

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      this.geocoder = new google.maps.Geocoder();

      this.marker = new google.maps.Marker({
        map: this.map,
        position: latLng,
        draggable: true,
        animation: google.maps.Animation.DROP
      });

      // Map click event
      this.map.addListener('click', (event: any) => {
        this.updateLocation(event.latLng);
      });

      // Marker drag event
      this.marker.addListener('dragend', () => {
        const position = this.marker.getPosition();
        this.updateLocation(position);
      });

      await this.getAddressFromCoords(latLng.lat, latLng.lng);
    } catch (error) {
      console.error('Map initialization error:', error);
      this.showToast('Unable to initialize map. Please check your location settings.');
    } finally {
      this.isLoading = false;
    }
  }

  private updateLocation(latLng: any) {
    this.marker.setPosition(latLng);
    this.getAddressFromCoords(latLng.lat(), latLng.lng());
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  }

  async searchLocation(event: any) {
    const searchTerm = event.target.value.trim();
    if (!searchTerm) return;

    try {
      const results = await this.geocoder.geocode({ address: searchTerm });
      if (results.results[0]) {
        const location = results.results[0].geometry.location;
        this.map.setCenter(location);
        this.updateLocation(location);
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showToast('Location not found');
    }
  }

  async getAddressFromCoords(lat: number, lng: number) {
    try {
      const result = await this.geocoder.geocode({
        location: { lat, lng }
      });

      this.ngZone.run(() => {
        if (result.results[0]) {
          this.address.address = result.results[0].formatted_address;
          this.address.latitude = lat;
          this.address.longitude = lng;
          this.fabAction = true;
        }
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      this.showToast('Error getting address details');
    }
  }

  async save() {
    if (!this.validateAddress()) return;

    const loading = await this.loadingCtrl.create({
      message: 'Saving address...'
    });
    await loading.present();

    try {
      await this.firebaseService.saveAddress(this.address);
      this.showToast('Address saved successfully');
      this.navCtrl.pop();
    } catch (error) {
      console.error('Save error:', error);
      this.showToast('Error saving address');
    } finally {
      loading.dismiss();
    }
  }

  private validateAddress(): boolean {
    if (!this.address.address) {
      this.showToast('Please select an address');
      return false;
    }
    if (!this.address.type) {
      this.showToast('Please select address type');
      return false;
    }
    if (!this.address.landmark) {
      this.showToast('Please add a landmark');
      return false;
    }
    return true;
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  toggleFab() {
    this.fabAction = !this.fabAction;
  }
}
