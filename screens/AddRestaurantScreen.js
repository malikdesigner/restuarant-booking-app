// screens/AddRestaurantScreen.js - Updated with restaurant types
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const { width, height } = Dimensions.get('window');

export default function AddRestaurantScreen({ navigation }) {
  const { user } = useAuth();
  const { addRestaurant } = useData();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    type: '', // Added restaurant type
    description: '',
    phone: '',
    email: '',
    address: '',
    latitude: null,
    longitude: null
  });

  const cuisineTypes = [
    'Pakistani', 'Indian', 'Chinese', 'Italian', 'American',
    'Thai', 'Mexican', 'Japanese', 'Mediterranean', 'Fast Food',
    'BBQ', 'Seafood', 'Continental', 'Desi', 'Karahi'
  ];

  const restaurantTypes = [
    { name: 'Go Green', color: '#4CAF50' },
    { name: 'Fine Dining', color: '#8E24AA' },
    { name: 'Casual Dining', color: '#FF7043' },
    { name: 'Cafe', color: '#795548' },
    { name: 'Fast Food', color: '#F44336' },
    { name: 'Buffet', color: '#FF9800' },
    { name: 'Food Truck', color: '#2196F3' },
    { name: 'Bakery', color: '#FFEB3B' },
    { name: 'Dessert Shop', color: '#E91E63' },
    { name: 'Bar', color: '#9C27B0' },
    { name: 'Pub', color: '#607D8B' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Improved address formatting function
  const formatAddress = (addressData) => {
    if (!addressData) return '';

    console.log('Raw address data:', addressData);

    const {
      name,
      streetNumber,
      street,
      subregion,
      city,
      region,
      country,
      formattedAddress,
      district
    } = addressData;

    // For Pakistan, construct a detailed address
    const addressParts = [];

    // Step 1: Add the most specific location identifier
    if (name && !name.includes('+') && name !== city && name !== subregion) {
      // Use name if it's not a plus code and provides meaningful info
      addressParts.push(name);
    }

    // Step 2: Add street information
    if (streetNumber && street) {
      addressParts.push(`${streetNumber} ${street}`);
    } else if (street && street !== name) {
      addressParts.push(street);
    }

    // Step 3: Add locality/area (subregion if different from city)
    if (subregion && subregion !== city && subregion !== region) {
      addressParts.push(subregion);
    }

    // Step 4: Add district if available and different from city
    if (district && district !== city && district !== subregion) {
      addressParts.push(district);
    }

    // Step 5: Add city
    if (city) {
      addressParts.push(city);
    }

    // Step 6: Add region/state if different from city
    if (region && region !== city && region !== district) {
      addressParts.push(region);
    }

    // Step 7: Add country
    if (country) {
      addressParts.push(country);
    }

    // Construct the final address
    let constructedAddress = addressParts.join(', ');

    // If we don't have enough meaningful parts, try to extract from formattedAddress
    if (addressParts.length < 3 && formattedAddress) {
      console.log('Using formatted address as fallback');

      // Clean up the formatted address
      let cleanedAddress = formattedAddress
        // Remove plus codes (like Q9J7+M2P)
        .replace(/[A-Z0-9]{4}\+[A-Z0-9]{2,}\s*,?\s*/g, '')
        // Remove extra commas and spaces
        .replace(/,\s*,/g, ',')
        .replace(/^\s*,\s*/, '')
        .replace(/\s*,\s*$/, '')
        .trim();

      if (cleanedAddress.length > constructedAddress.length) {
        constructedAddress = cleanedAddress;
      }
    }

    // Final cleanup
    constructedAddress = constructedAddress
      .replace(/,\s*,/g, ',')
      .replace(/^\s*,\s*/, '')
      .replace(/\s*,\s*$/, '')
      .trim();

    console.log('Formatted address:', constructedAddress);

    return constructedAddress || 'Location detected';
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add restaurant image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Improved getCurrentLocation function
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant location permissions to get current location.');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      const { latitude, longitude } = location.coords;

      // Validate coordinates
      if (!latitude || !longitude ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
        throw new Error('Invalid coordinates received');
      }

      // Get address from coordinates
      try {
        const addressResult = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });

        console.log('Address result:', addressResult);

        if (addressResult.length > 0) {
          const formattedAddress = formatAddress(addressResult[0]);

          setFormData(prev => ({
            ...prev,
            address: formattedAddress,
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6))
          }));

          Alert.alert(
            'Location Retrieved',
            `Address: ${formattedAddress}\n\nWould you like to fine-tune the location on the map?`,
            [
              { text: 'Use This Location', style: 'default' },
              { text: 'Pick on Map', onPress: () => openMapPicker(latitude, longitude) }
            ]
          );
        } else {
          // If reverse geocoding fails, still set coordinates and offer map picker
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6))
          }));

          Alert.alert(
            'Location Retrieved',
            'Location detected but address not found. Would you like to pick the exact location on the map?',
            [
              { text: 'Use Current Location', style: 'default' },
              { text: 'Pick on Map', onPress: () => openMapPicker(latitude, longitude) }
            ]
          );
        }
      } catch (geocodingError) {
        console.warn('Reverse geocoding failed:', geocodingError);
        // Still set coordinates and offer map picker
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6))
        }));

        Alert.alert(
          'Location Retrieved',
          'Location detected. Would you like to pick the exact location on the map?',
          [
            { text: 'Use Current Location', style: 'default' },
            { text: 'Pick on Map', onPress: () => openMapPicker(latitude, longitude) }
          ]
        );
      }

    } catch (error) {
      console.error('Location error:', error);
      let errorMessage = 'Failed to get location. Please try again.';

      if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out. Please try again.';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location services unavailable. Please enable GPS.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  // Function to open map picker
  const openMapPicker = (lat, lng) => {
    setTempLocation({
      latitude: lat || 33.6844,
      longitude: lng || 73.0479
    });
    setShowMapPicker(true);
  };

  // Handle map picker selection
  const handleMapPickerSelect = async () => {
    if (!tempLocation) return;

    try {
      // Get address for the selected location
      const addressResult = await Location.reverseGeocodeAsync(tempLocation);

      let address = formData.address;
      if (addressResult.length > 0) {
        address = formatAddress(addressResult[0]);
      }

      setFormData(prev => ({
        ...prev,
        address,
        latitude: parseFloat(tempLocation.latitude.toFixed(6)),
        longitude: parseFloat(tempLocation.longitude.toFixed(6))
      }));

      setShowMapPicker(false);
      Alert.alert('Success', 'Location selected successfully!');
    } catch (error) {
      console.error('Error getting address for selected location:', error);
      // Still use the coordinates even if address lookup fails
      setFormData(prev => ({
        ...prev,
        latitude: parseFloat(tempLocation.latitude.toFixed(6)),
        longitude: parseFloat(tempLocation.longitude.toFixed(6))
      }));

      setShowMapPicker(false);
      Alert.alert('Success', 'Location selected successfully!');
    }
  };

  const validateForm = () => {
    const { name, cuisine, type, description, phone, email, address, latitude, longitude } = formData;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter restaurant name');
      return false;
    }

    if (!cuisine.trim()) {
      Alert.alert('Error', 'Please select cuisine type');
      return false;
    }

    if (!type.trim()) {
      Alert.alert('Error', 'Please select restaurant type');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter restaurant description');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter restaurant address');
      return false;
    }

    if (!latitude || !longitude ||
      typeof latitude !== 'number' || typeof longitude !== 'number' ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
      Alert.alert('Error', 'Please set a valid restaurant location using GPS or map picker');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const restaurantData = {
        name: formData.name.trim(),
        cuisine: formData.cuisine,
        type: formData.type, // Added restaurant type
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        location: {
          address: formData.address.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude
        }
      };

      const result = await addRestaurant(restaurantData, imageUri);

      if (result.success) {
        Alert.alert(
          'Success',
          'Restaurant added successfully! You can now manage it from "My Restaurants" tab.',
          [
            {
              text: 'View My Restaurants',
              onPress: () => {
                navigation.navigate('MainTabs', { screen: 'MyRestaurants' });
              }
            },
            {
              text: 'Add Another',
              onPress: () => {
                // Reset form for another restaurant
                setFormData({
                  name: '',
                  cuisine: '',
                  type: '',
                  description: '',
                  phone: '',
                  email: '',
                  address: '',
                  latitude: null,
                  longitude: null
                });
                setImageUri(null);
              }
            }
          ]
        );
      } else {
        // Handle specific image upload errors
        if (result.error && result.error.includes('Image upload failed')) {
          Alert.alert(
            'Image Upload Failed', 
            `${result.error}\n\nWould you like to add the restaurant without an image?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Continue Without Image', 
                onPress: async () => {
                  setLoading(true);
                  const resultWithoutImage = await addRestaurant(restaurantData, null);
                  setLoading(false);
                  
                  if (resultWithoutImage.success) {
                    Alert.alert('Success', 'Restaurant added successfully without image!');
                    navigation.navigate('MainTabs', { screen: 'MyRestaurants' });
                  } else {
                    Alert.alert('Error', 'Failed to add restaurant. Please try again.');
                  }
                }
              }
            ]
          );
          return;
        }
        
        throw new Error(result.error || 'Failed to add restaurant');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to add restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="person-outline" size={80} color="#ccc" />
        <Text style={styles.unauthorizedTitle}>Login Required</Text>
        <Text style={styles.unauthorizedSubtitle}>
          Please login or create an account to add a restaurant
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Restaurant</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome, {user.name}!</Text>
          <Text style={styles.welcomeSubtitle}>
            Add your restaurant and start reaching more customers online
          </Text>
        </View>

        {/* Image Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Image</Text>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#ccc" />
                <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                <Text style={styles.imageHint}>Add an attractive photo of your restaurant</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="restaurant-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Restaurant Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="fast-food-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Cuisine Type (e.g., Pakistani, Italian)"
              value={formData.cuisine}
              onChangeText={(value) => handleInputChange('cuisine', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell customers about your restaurant..."
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Restaurant Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Type</Text>
          <Text style={styles.sectionSubtitle}>Choose the type that best describes your restaurant</Text>
          <View style={styles.typeGrid}>
            {restaurantTypes.map((type) => (
              <TouchableOpacity
                key={type.name}
                style={[
                  styles.typeChip,
                  formData.type === type.name && { ...styles.selectedTypeChip, backgroundColor: type.color }
                ]}
                onPress={() => handleInputChange('type', type.name)}
              >
                <View style={[styles.typeColorIndicator, { backgroundColor: type.color }]} />
                <Text style={[
                  styles.typeChipText,
                  formData.type === type.name && styles.selectedTypeChipText
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Complete Address"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.locationButtons}>
            <TouchableOpacity
              style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="locate" size={20} color="#fff" style={styles.locationIcon} />
                  <Text style={styles.locationButtonText}>Get GPS Location</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openMapPicker(formData.latitude, formData.longitude)}
            >
              <Ionicons name="map" size={20} color="#2196F3" style={styles.locationIcon} />
              <Text style={styles.mapButtonText}>Pick on Map</Text>
            </TouchableOpacity>
          </View>

          {formData.latitude && formData.longitude && (
            <View style={styles.coordinatesContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.coordinatesText}>
                Location set: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>

        {/* Cuisine Type Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Cuisine Types</Text>
          <View style={styles.cuisineGrid}>
            {cuisineTypes.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.cuisineChip,
                  formData.cuisine === cuisine && styles.selectedCuisineChip
                ]}
                onPress={() => handleInputChange('cuisine', cuisine)}
              >
                <Text style={[
                  styles.cuisineChipText,
                  formData.cuisine === cuisine && styles.selectedCuisineChipText
                ]}>
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>What happens after you add your restaurant?</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Your restaurant will appear on the map for customers to discover</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>You can manage your menu from "My Restaurants" tab</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Receive and manage orders from customers</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Track reviews and ratings</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="restaurant" size={20} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>Add My Restaurant</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={styles.mapPickerContainer}>
          <View style={styles.mapPickerHeader}>
            <TouchableOpacity
              style={styles.mapPickerCancelButton}
              onPress={() => setShowMapPicker(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.mapPickerHeaderTitle}>Select Location</Text>
            <TouchableOpacity
              style={styles.mapPickerConfirmButton}
              onPress={handleMapPickerSelect}
            >
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.mapPickerMap}
            initialRegion={{
              latitude: tempLocation?.latitude || 33.6844,
              longitude: tempLocation?.longitude || 73.0479,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => setTempLocation(e.nativeEvent.coordinate)}
          >
            {tempLocation && (
              <Marker
                coordinate={tempLocation}
                draggable
                onDragEnd={(e) => setTempLocation(e.nativeEvent.coordinate)}
              >
                <View style={styles.mapPickerMarkerContainer}>
                  <Ionicons name="location" size={30} color="#FF6B35" />
                </View>
              </Marker>
            )}
          </MapView>

          <View style={styles.mapPickerInstructions}>
            <Text style={styles.mapPickerInstructionsText}>
              Tap on the map or drag the marker to select your restaurant's exact location
            </Text>
            {tempLocation && (
              <Text style={styles.mapPickerCoordinatesText}>
                📍 {tempLocation.latitude.toFixed(6)}, {tempLocation.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  unauthorizedSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  signupButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBackButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
  },
  imageHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 10,
    marginTop: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Restaurant Type Styles
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  selectedTypeChip: {
    borderColor: 'transparent',
  },
  typeColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  typeChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedTypeChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  mapButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cuisineChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCuisineChip: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  cuisineChipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCuisineChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  benefitsSection: {
    backgroundColor: '#f0f8f0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Map Picker Styles
  mapPickerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mapPickerCancelButton: {
    padding: 5,
  },
  mapPickerHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapPickerConfirmButton: {
    padding: 5,
  },
  mapPickerMap: {
    flex: 1,
  },
  mapPickerMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickerInstructions: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mapPickerInstructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  mapPickerCoordinatesText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '600',
  },
});