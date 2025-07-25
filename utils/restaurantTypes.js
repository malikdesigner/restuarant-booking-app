// utils/restaurantTypes.js - Restaurant types configuration and utilities

export const RESTAURANT_TYPES = [
  { name: 'Go Green', color: '#4CAF50', description: 'Eco-friendly and sustainable dining' },
  { name: 'Fine Dining', color: '#8E24AA', description: 'Upscale restaurants with premium service' },
  { name: 'Casual Dining', color: '#FF7043', description: 'Relaxed atmosphere with table service' },
  { name: 'Cafe', color: '#795548', description: 'Coffee shops and light meals' },
  { name: 'Fast Food', color: '#F44336', description: 'Quick service restaurants' },
  { name: 'Buffet', color: '#FF9800', description: 'Self-service dining with variety' },
  { name: 'Food Truck', color: '#2196F3', description: 'Mobile food vendors' },
  { name: 'Bakery', color: '#FFEB3B', description: 'Fresh baked goods and pastries' },
  { name: 'Dessert Shop', color: '#E91E63', description: 'Sweets, ice cream, and desserts' },
  { name: 'Bar', color: '#9C27B0', description: 'Drinks and bar food' },
  { name: 'Pub', color: '#607D8B', description: 'Casual drinking establishment with food' }
];

// Create a color mapping object for quick lookups
export const RESTAURANT_TYPE_COLORS = RESTAURANT_TYPES.reduce((acc, type) => {
  acc[type.name] = type.color;
  return acc;
}, {});

/**
 * Get the color for a specific restaurant type
 * @param {string} type - The restaurant type name
 * @returns {string} - The hex color code
 */
export const getRestaurantTypeColor = (type) => {
  return RESTAURANT_TYPE_COLORS[type] || '#FF6B35'; // Default orange color
};

/**
 * Get restaurant type information including color and description
 * @param {string} type - The restaurant type name
 * @returns {object|null} - Restaurant type object or null if not found
 */
export const getRestaurantTypeInfo = (type) => {
  return RESTAURANT_TYPES.find(t => t.name === type) || null;
};

/**
 * Get all available restaurant types
 * @returns {array} - Array of restaurant type objects
 */
export const getAllRestaurantTypes = () => {
  return RESTAURANT_TYPES;
};

/**
 * Get only the names of all restaurant types
 * @returns {array} - Array of restaurant type names
 */
export const getRestaurantTypeNames = () => {
  return RESTAURANT_TYPES.map(type => type.name);
};

/**
 * Validate if a restaurant type exists
 * @param {string} type - The restaurant type name to validate
 * @returns {boolean} - True if the type exists, false otherwise
 */
export const isValidRestaurantType = (type) => {
  return RESTAURANT_TYPES.some(t => t.name === type);
};

/**
 * Get restaurants filtered by type
 * @param {array} restaurants - Array of restaurant objects
 * @param {string} type - The restaurant type to filter by
 * @returns {array} - Filtered array of restaurants
 */
export const getRestaurantsByType = (restaurants, type) => {
  return restaurants.filter(restaurant => restaurant.type === type);
};

/**
 * Group restaurants by their types
 * @param {array} restaurants - Array of restaurant objects
 * @returns {object} - Object with type names as keys and arrays of restaurants as values
 */
export const groupRestaurantsByType = (restaurants) => {
  return restaurants.reduce((acc, restaurant) => {
    const type = restaurant.type || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(restaurant);
    return acc;
  }, {});
};

/**
 * Get statistics about restaurant types
 * @param {array} restaurants - Array of restaurant objects
 * @returns {object} - Statistics object with counts per type
 */
export const getRestaurantTypeStats = (restaurants) => {
  const stats = {};
  let totalWithType = 0;
  
  // Initialize all types with 0
  RESTAURANT_TYPES.forEach(type => {
    stats[type.name] = {
      count: 0,
      percentage: 0,
      color: type.color
    };
  });
  
  // Count restaurants by type
  restaurants.forEach(restaurant => {
    if (restaurant.type && stats[restaurant.type]) {
      stats[restaurant.type].count++;
      totalWithType++;
    }
  });
  
  // Calculate percentages
  Object.keys(stats).forEach(type => {
    if (totalWithType > 0) {
      stats[type].percentage = ((stats[type].count / totalWithType) * 100).toFixed(1);
    }
  });
  
  return {
    stats,
    totalWithType,
    totalRestaurants: restaurants.length,
    withoutType: restaurants.length - totalWithType
  };
};

/**
 * Generate a random restaurant type (useful for testing)
 * @returns {object} - Random restaurant type object
 */
export const getRandomRestaurantType = () => {
  const randomIndex = Math.floor(Math.random() * RESTAURANT_TYPES.length);
  return RESTAURANT_TYPES[randomIndex];
};

/**
 * Sort restaurant types by name
 * @param {boolean} ascending - Sort in ascending order (default: true)
 * @returns {array} - Sorted array of restaurant types
 */
export const getSortedRestaurantTypes = (ascending = true) => {
  return [...RESTAURANT_TYPES].sort((a, b) => {
    return ascending 
      ? a.name.localeCompare(b.name) 
      : b.name.localeCompare(a.name);
  });
};

/**
 * Get complementary color for a restaurant type (useful for text over colored backgrounds)
 * @param {string} type - The restaurant type name
 * @returns {string} - '#fff' for dark backgrounds, '#000' for light backgrounds
 */
export const getComplementaryColor = (type) => {
  const color = getRestaurantTypeColor(type);
  
  // Convert hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000' : '#fff';
};

/**
 * Search restaurant types by name (case-insensitive partial match)
 * @param {string} query - Search query
 * @returns {array} - Array of matching restaurant types
 */
export const searchRestaurantTypes = (query) => {
  if (!query || query.trim() === '') {
    return RESTAURANT_TYPES;
  }
  
  const searchTerm = query.toLowerCase().trim();
  return RESTAURANT_TYPES.filter(type => 
    type.name.toLowerCase().includes(searchTerm) ||
    type.description.toLowerCase().includes(searchTerm)
  );
};

export default {
  RESTAURANT_TYPES,
  RESTAURANT_TYPE_COLORS,
  getRestaurantTypeColor,
  getRestaurantTypeInfo,
  getAllRestaurantTypes,
  getRestaurantTypeNames,
  isValidRestaurantType,
  getRestaurantsByType,
  groupRestaurantsByType,
  getRestaurantTypeStats,
  getRandomRestaurantType,
  getSortedRestaurantTypes,
  getComplementaryColor,
  searchRestaurantTypes
};