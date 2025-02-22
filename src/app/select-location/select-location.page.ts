import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';

declare var google: any;

@Component({
  selector: 'app-select-location',
  templateUrl: './select-location.page.html',
  styleUrls: ['./select-location.page.scss'],
})
export class SelectLocationPage implements OnInit {
  @ViewChild('map') mapElement!: ElementRef;

  map: any;
  marker: any;
  geocoder: any;
  locationType: 'pickup' | 'drop' = 'pickup';
  selectedLocation: string = '';
  currentLocation: any;

  constructor(
    private navCtrl: NavController,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['locationType']) {
      this.locationType = navigation.extras.state['locationType'];
    }
  }

  async ngOnInit() {
    await this.loadMap();
    this.geocoder = new google.maps.Geocoder();
  }

  async loadMap() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      this.currentLocation = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      const mapOptions = {
        center: this.currentLocation,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.marker = new google.maps.Marker({
        map: this.map,
        position: this.currentLocation,
        draggable: true,
        animation: google.maps.Animation.DROP
      });

      this.marker.addListener('dragend', () => {
        this.updateLocationDetails(this.marker.getPosition());
      });

      this.map.addListener('click', (event: any) => {
        this.marker.setPosition(event.latLng);
        this.updateLocationDetails(event.latLng);
      });

      await this.updateLocationDetails(this.currentLocation);

    } catch (error) {
      console.error('Error loading map:', error);
    }
  }

  async updateLocationDetails(latLng: any) {
    try {
      const response = await new Promise((resolve, reject) => {
        this.geocoder.geocode({ location: latLng }, (results: any, status: any) => {
          if (status === 'OK') {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });

      const results: any = response;
      if (results[0]) {
        this.selectedLocation = results[0].formatted_address;
      }
    } catch (error) {
      console.error('Error getting address', error);
    }
  }

  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      const position = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      this.marker.setAnimation(google.maps.Animation.BOUNCE);
      this.marker.setPosition(position);
      this.map.panTo(position);
      this.map.setZoom(17);

      await this.updateLocationDetails(position);

      setTimeout(() => {
        this.marker.setAnimation(null);
      }, 1500);

    } catch (error) {
      console.error('Error getting current location', error);
    }
  }

  confirmLocation() {
    const locationData = {
      address: this.selectedLocation,
      lat: this.marker.getPosition().lat(),
      lng: this.marker.getPosition().lng(),
      type: this.locationType
    };

    this.navCtrl.navigateBack('/home', {
      state: { location: locationData }
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}
