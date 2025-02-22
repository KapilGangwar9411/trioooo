/// <reference types="googlemaps" />

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonDatetime } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { format, parseISO } from 'date-fns'
import Swiper from 'swiper'
import { Geolocation } from '@capacitor/geolocation';
import { filter } from 'rxjs/operators';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  modes = ['date-time'];
  select_seat: string = "1";
  select_vehicle: string = "1";
  swiper!: Swiper;
  segment: string = "0"
  showPicker = false;
  dateValue = format(new Date(), 'yyyy-MM-dd') + 'T09:00:00.000Z';
  formattedString = '';
  @ViewChild('map') mapElement!: ElementRef;
  @ViewChild('pickupInput') pickupInput!: ElementRef;
  @ViewChild('dropInput') dropInput!: ElementRef;

  map: any;
  pickupAutocomplete: any;
  dropAutocomplete: any;
  currentLocation: string = '';
  marker: any;
  watchId: any;
  accuracyCircle: any;

  // Custom marker icon
  markerIcon = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 12,
    fillColor: "#1976D2",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
  };

  // GPS button icon
  gpsButtonDiv: any;
  gpsButton: any;

  @ViewChild(IonDatetime) datetime!: IonDatetime;
  constructor(private route: Router) {
    this.setToday();
  }
  setToday() {
    this.formattedString = format(parseISO(format(new Date(), 'yyyy-MM-dd') + 'T09:00:00.000Z'), 'd MMM, HH:mm');
  }

  async ngOnInit() {
    await this.loadMap();
    this.setupAutocomplete();
    this.addGPSButton();

    // Listen for navigation events with location data
    this.route.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const navigation = this.route.getCurrentNavigation();
      if (navigation?.extras.state?.['location']) {
        const locationData = navigation.extras.state['location'];
        this.currentLocation = locationData.address;
        if (this.pickupInput?.nativeElement) {
          this.pickupInput.nativeElement.value = locationData.address;
        }
      }
    });
  }

  async loadMap() {
    try {
      // Get current position
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      const position = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      // Create map with custom styles
      const mapOptions = {
        center: position,
        zoom: 16, // Increased zoom level
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
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

      // Add custom marker for current location
      this.marker = new google.maps.Marker({
        position: position,
        map: this.map,
        title: 'Current Location',
        icon: this.markerIcon,
        animation: google.maps.Animation.DROP
      });

      // Add accuracy circle with reduced size and opacity
      this.accuracyCircle = new google.maps.Circle({
        strokeColor: '#1976D2',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#1976D2',
        fillOpacity: 0.1,
        map: this.map,
        center: position,
        radius: Math.min(coordinates.coords.accuracy, 50) // Limit the radius to 50 meters maximum
      });

      // Get address from coordinates
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          this.currentLocation = results[0].formatted_address;
        }
      });

    } catch (error) {
      console.error('Error getting location', error);
    }
  }

  // Watch for position changes
  async watchPosition() {
    try {
      this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position) => {
          if (position) {
            const newPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            // Update marker position with animation
            this.marker.setPosition(newPosition);
            this.map.panTo(newPosition);
          }
        }
      );
    } catch (error) {
      console.error('Error watching location', error);
    }
  }

  // Clean up when component is destroyed
  ngOnDestroy() {
    if (this.watchId != null) {
      Geolocation.clearWatch({ id: this.watchId });
    }
  }

  // Center map on current location
  async centerOnLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      const position = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      this.map.panTo(position);
      this.map.setZoom(15);

      // Add bounce animation to marker
      this.marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        this.marker.setAnimation(null);
      }, 1500);
    } catch (error) {
      console.error('Error centering location', error);
    }
  }

  setupAutocomplete() {
    // Setup pickup autocomplete
    this.pickupAutocomplete = new google.maps.places.Autocomplete(
      this.pickupInput.nativeElement
    );

    // Setup drop location autocomplete
    this.dropAutocomplete = new google.maps.places.Autocomplete(
      this.dropInput.nativeElement
    );

    // Add place_changed listeners
    this.pickupAutocomplete.addListener('place_changed', () => {
      const place = this.pickupAutocomplete.getPlace();
      if (place.geometry) {
        this.map.setCenter(place.geometry.location);
        this.marker.setPosition(place.geometry.location);
      }
    });

    this.dropAutocomplete.addListener('place_changed', () => {
      const place = this.dropAutocomplete.getPlace();
      if (place.geometry) {
        // You can add a second marker or draw route here if needed
      }
    });
  }

  onSegmentChange(event: any) {
    const selectedIndex = event.detail.value;
    (<any>document.getElementById("swiper1")).swiper.slideTo(selectedIndex);
  }

  onSlideChange(event: any) {
    this.segment = `${(<any>document.getElementById("swiper1")).swiper.activeIndex}`;
  }
  select_location() {
    this.route.navigate(['/select-location']);
  }
  listOfPooler() {
    this.route.navigate(['./list-of-pooler']);
  }
  poolTakers() {
    this.route.navigate(['./pool-takers']);
  }
  dateChanged(value: any) {
    this.dateValue = value;
    this.formattedString = format(parseISO(value), 'd MMM, HH:mm');
  }

  close() {
    this.datetime.cancel(true);
  }
  select() {
    this.datetime.confirm(true);
  }

  // Get and update current location
  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      const position = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      // Update marker and map
      this.marker.setPosition(position);
      this.map.panTo(position);
      this.map.setZoom(16);

      // Update accuracy circle
      if (this.accuracyCircle) {
        this.accuracyCircle.setMap(null);
      }

      this.accuracyCircle = new google.maps.Circle({
        strokeColor: '#1976D2',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#1976D2',
        fillOpacity: 0.1,
        map: this.map,
        center: position,
        radius: Math.min(coordinates.coords.accuracy, 50)
      });

      // Add bounce animation to marker
      this.marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        this.marker.setAnimation(null);
      }, 1500);

      // Update pickup location address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          this.currentLocation = results[0].formatted_address;
          if (this.pickupInput && this.pickupInput.nativeElement) {
            this.pickupInput.nativeElement.value = results[0].formatted_address;
          }
        }
      });

    } catch (error) {
      console.error('Error getting location', error);
    }
  }

  addGPSButton() {
    this.gpsButtonDiv = document.createElement('div');
    this.gpsButtonDiv.className = 'custom-map-control';

    const controlButton = document.createElement('button');
    controlButton.className = 'custom-map-control-button';
    controlButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
        </svg>`;

    this.gpsButtonDiv.appendChild(controlButton);
    this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.gpsButtonDiv);

    controlButton.addEventListener('click', () => {
      this.getCurrentLocation();
    });
  }

  // Add this method to handle location selection
  openLocationSelector(type: 'pickup' | 'drop') {
    this.route.navigate(['/select-location'], {
      state: { locationType: type }
    });
  }
}
