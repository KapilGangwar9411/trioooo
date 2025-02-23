import { Injectable } from '@angular/core';
import { getFirestore, doc, onSnapshot, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { UserProfile } from '../interfaces/user.interface';
import { Address } from '../interfaces/address.interface';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db = getFirestore();

  constructor() {
    // Initialize Firestore when service is created
    this.db = getFirestore();
  }

  private async ensureAuthenticated(): Promise<string> {
    return new Promise((resolve, reject) => {
      const auth = getAuth();
      if (!auth) {
        reject(new Error('Firebase Auth not initialized'));
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe(); // Unsubscribe immediately after first callback
        if (user) {
          resolve(user.uid);
        } else {
          reject(new Error('User not authenticated'));
        }
      }, (error) => {
        reject(error);
      });
    });
  }

  async getUserProfile(): Promise<UserProfile> {
    try {
      const userId = await this.ensureAuthenticated();
      console.log('Getting profile for user:', userId);

      const userDocRef = doc(this.db, 'users', userId);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        console.log('Creating new profile for user');
        const auth = getAuth();
        const emptyProfile: UserProfile = {
          fullName: auth.currentUser?.displayName || '',
          email: auth.currentUser?.email || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, emptyProfile);
        return emptyProfile;
      }

      console.log('Profile found:', docSnap.data());
      return docSnap.data() as UserProfile;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw new Error(`Failed to get user profile: ${(error as Error).message}`);
    }
  }

  getUserProfileUpdates(): Observable<UserProfile> {
    return new Observable((subscriber) => {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;

      if (!userId) {
        subscriber.error('No user logged in');
        return;
      }

      const userDocRef = doc(this.db, 'users', userId);
      return onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next(snapshot.data() as UserProfile);
          }
        },
        (error) => subscriber.error(error)
      );
    });
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const userId = await this.ensureAuthenticated();
      console.log('Saving profile for user:', userId);

      const userDocRef = doc(this.db, 'users', userId);
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString()
      };

      await setDoc(userDocRef, updatedProfile, { merge: true });
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error in saveUserProfile:', error);
      throw new Error(`Failed to save user profile: ${(error as Error).message}`);
    }
  }

  async saveAddress(address: Address): Promise<void> {
    try {
      const userId = await this.ensureAuthenticated();
      console.log('Saving address for user:', userId);

      const addressData = {
        ...address,
        userId,
        createdAt: new Date().toISOString()
      };

      const addressesRef = collection(this.db, 'addresses');
      await addDoc(addressesRef, addressData);
      console.log('Address saved successfully');
    } catch (error) {
      console.error('Error in saveAddress:', error);
      throw new Error(`Failed to save address: ${(error as Error).message}`);
    }
  }

  async getAddresses(): Promise<Address[]> {
    try {
      const userId = await this.ensureAuthenticated();
      console.log('Getting addresses for user:', userId);

      const addressesRef = collection(this.db, 'addresses');
      const q = query(addressesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const addresses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Address));

      console.log('Addresses retrieved:', addresses);
      return addresses;
    } catch (error) {
      console.error('Error in getAddresses:', error);
      throw new Error(`Failed to load addresses: ${(error as Error).message}`);
    }
  }

  async deleteAddress(addressId: string): Promise<void> {
    try {
      const userId = await this.ensureAuthenticated();
      console.log('Deleting address:', addressId, 'for user:', userId);

      const addressRef = doc(this.db, 'addresses', addressId);
      const addressSnap = await getDoc(addressRef);

      if (!addressSnap.exists()) {
        throw new Error('Address not found');
      }

      const addressData = addressSnap.data() as Address;
      if (addressData.userId !== userId) {
        throw new Error('Unauthorized to delete this address');
      }

      await deleteDoc(addressRef);
      console.log('Address deleted successfully');
    } catch (error) {
      console.error('Error in deleteAddress:', error);
      throw new Error(`Failed to delete address: ${(error as Error).message}`);
    }
  }
}
