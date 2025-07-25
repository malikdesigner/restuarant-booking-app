// screens/RestaurantDetailScreen.js - Updated with calorie display
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const { user } = useAuth();
  const { placeOrder, addToFavorites, removeFromFavorites, addReview } = useData();
  const [cart, setCart] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const isFavorite = user?.favoriteRestaurants?.includes(restaurant.id);

  const addToCart = (item) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      if (existingItem.quantity === 1) {
        return prev.filter(cartItem => cartItem.id !== itemId);
      }
      return prev.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalCalories = () => {
    return cart.reduce((total, item) => total + ((item.calories || 0) * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before placing order.');
      return;
    }

    const orderData = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantImage: restaurant.image,
      items: cart,
      totalPrice: getTotalPrice(),
      totalCalories: getTotalCalories(), // Include total calories in order
      deliveryAddress: user.address,
    };

    const result = await placeOrder(orderData);
    if (result.success) {
      setCart([]);
      Alert.alert('Order Placed', 'Your order has been placed successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Orders') }
      ]);
    } else {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    if (isFavorite) {
      await removeFromFavorites(restaurant.id);
    } else {
      await addToFavorites(restaurant.id);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    const result = await addReview(restaurant.id, rating, reviewText.trim());
    if (result.success) {
      setShowReviewModal(false);
      setReviewText('');
      setRating(5);
      Alert.alert('Success', 'Your review has been submitted!');
    } else {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const renderMenuItem = ({ item }) => {
    const cartItem = cart.find(cartItem => cartItem.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    const itemCalories = item.calories || 0;

    return (
      <View style={styles.menuItem}>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.menuItemImage} />
        )}
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <View style={styles.menuItemPricing}>
            <Text style={styles.menuItemPrice}>Rs. {item.price}</Text>
            {itemCalories > 0 && (
              <View style={styles.calorieContainer}>
                <Ionicons name="flame-outline" size={14} color="#FF6B35" />
                <Text style={styles.calorieText}>{itemCalories} cal</Text>
              </View>
            )}
          </View>
          {!item.isAvailable && (
            <Text style={styles.unavailableText}>Currently unavailable</Text>
          )}
        </View>
        <View style={styles.quantityContainer}>
          {quantity > 0 && (
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => removeFromCart(item.id)}
            >
              <Ionicons name="remove" size={16} color="#FF6B35" />
            </TouchableOpacity>
          )}
          {quantity > 0 && (
            <Text style={styles.quantityText}>{quantity}</Text>
          )}
          <TouchableOpacity
            style={[
              styles.quantityButton,
              !item.isAvailable && styles.disabledQuantityButton
            ]}
            onPress={() => item.isAvailable && addToCart(item)}
            disabled={!item.isAvailable}
          >
            <Ionicons 
              name="add" 
              size={16} 
              color={item.isAvailable ? "#FF6B35" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStars = (currentRating, onPress = null) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= currentRating ? "star" : "star-outline"}
              size={24}
              color="#FFD700"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const totalCalories = getTotalCalories();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{restaurant.name}</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color="#FF6B35" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
        
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.rating}>{restaurant.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.reviewCount}>({restaurant.reviewCount || 0} reviews)</Text>
            <TouchableOpacity
              style={styles.addReviewButton}
              onPress={() => setShowReviewModal(true)}
            >
              <Text style={styles.addReviewText}>Add Review</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.address}>{restaurant.location.address}</Text>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {restaurant.menu && restaurant.menu.length > 0 ? (
            <FlatList
              data={restaurant.menu}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyMenuContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#ccc" />
              <Text style={styles.emptyMenuText}>Menu not available</Text>
              <Text style={styles.emptyMenuSubtext}>Contact restaurant for menu details</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.cartSummary}>
          <View style={styles.cartInfo}>
            <View style={styles.cartPriceRow}>
              <Text style={styles.cartTotal}>Total: Rs. {getTotalPrice()}</Text>
              <Text style={styles.cartItems}>{cart.length} items</Text>
            </View>
            {totalCalories > 0 && (
              <View style={styles.cartCaloriesRow}>
                <Ionicons name="flame" size={16} color="#FF6B35" />
                <Text style={styles.cartCalories}>{totalCalories} calories</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder}>
            <Text style={styles.orderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingLabel}>Your Rating</Text>
            {renderStars(rating, setRating)}

            <Text style={styles.reviewLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitReview}
            >
              <Text style={styles.submitButtonText}>Submit Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: '#fff',
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  favoriteButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
  },
  restaurantInfo: {
    padding: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  restaurantCuisine: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  reviewCount: {
    marginLeft: 5,
    fontSize: 14,
    color: '#999',
  },
  addReviewButton: {
    marginLeft: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
  },
  addReviewText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#999',
  },
  menuSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  menuItemPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  calorieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calorieText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  unavailableText: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledQuantityButton: {
    backgroundColor: '#f8f8f8',
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyMenuContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMenuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  emptyMenuSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartInfo: {
    flex: 1,
  },
  cartPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItems: {
    fontSize: 14,
    color: '#666',
  },
  cartCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cartCalories: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  orderButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 15,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  star: {
    marginRight: 5,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});