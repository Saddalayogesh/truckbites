// ============================================================================
// TruckBites - Vendor/Truck/Menu Seed Generator
// ============================================================================
// Reads the seed data below, generates BCrypt password hashes (bcryptjs),
// and writes three SQL files in the current working directory:
//   seed-auth.sql   -> users INSERTs for truckbites_auth_db
//   seed-truck.sql  -> trucks INSERTs for truckbites_truck_db
//   seed-menu.sql   -> menu_items INSERTs for truckbites_menu_db
//
// Run (after `npm install bcryptjs` in this folder):
//   node seed-vendors.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// ---------------------------------------------------------------------------
// Seed data (new dataset - Hyderabad food trucks)
// ---------------------------------------------------------------------------
const VENDORS = [
  {
    vendor: { name: 'Biryani Wheels', email: 'biryaniwheels@hydstreeteats.com', password: 'biryaniwheels123' },
    trucks: [{
      name: 'Biryani Wheels', cuisineType: 'Hyderabadi', latitude: 17.3616, longitude: 78.4747, imageUrl: '/trucks/biryani-wheels.webp',
      description: 'Dum biryani and Hyderabadi classics near Charminar', estimatedPrepTimeMinutes: 25,
      menu: [
        { name: 'Chicken Dum Biryani', price: 249, category: 'Biryani', quantityAvailable: 50, isAvailable: true },
        { name: 'Mutton Biryani', price: 329, category: 'Biryani', quantityAvailable: 35, isAvailable: true },
        { name: 'Veg Biryani', price: 189, category: 'Biryani', quantityAvailable: 30, isAvailable: true },
        { name: 'Chicken 65', price: 229, category: 'Starters', quantityAvailable: 40, isAvailable: true },
        { name: 'Seekh Kebab', price: 259, category: 'Starters', quantityAvailable: 35, isAvailable: true },
        { name: 'Double Ka Meetha', price: 99, category: 'Desserts', quantityAvailable: 25, isAvailable: true },
        { name: 'Qubani Ka Meetha', price: 119, category: 'Desserts', quantityAvailable: 25, isAvailable: true },
        { name: 'Irani Chai', price: 40, category: 'Beverages', quantityAvailable: 80, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Tandoori Tadka', email: 'tandooritadka@hydstreeteats.com', password: 'tandooritadka123' },
    trucks: [{
      name: 'Tandoori Tadka', cuisineType: 'North Indian', latitude: 17.4326, longitude: 78.4071, imageUrl: '/trucks/tandoori-tadka.webp',
      description: 'Tandoori grills and North Indian curries in Jubilee Hills', estimatedPrepTimeMinutes: 20,
      menu: [
        { name: 'Tandoori Chicken', price: 329, category: 'Tandoori', quantityAvailable: 35, isAvailable: true },
        { name: 'Chicken Tikka', price: 279, category: 'Tandoori', quantityAvailable: 40, isAvailable: true },
        { name: 'Paneer Tikka', price: 249, category: 'Tandoori', quantityAvailable: 35, isAvailable: true },
        { name: 'Butter Naan', price: 55, category: 'Breads', quantityAvailable: 60, isAvailable: true },
        { name: 'Garlic Naan', price: 65, category: 'Breads', quantityAvailable: 60, isAvailable: true },
        { name: 'Butter Chicken', price: 289, category: 'Mains', quantityAvailable: 30, isAvailable: true },
        { name: 'Dal Makhani', price: 219, category: 'Mains', quantityAvailable: 35, isAvailable: true },
        { name: 'Sweet Lassi', price: 89, category: 'Beverages', quantityAvailable: 50, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Dosa Delight', email: 'dosadelight@hydstreeteats.com', password: 'dosadelight123' },
    trucks: [{
      name: 'Dosa Delight', cuisineType: 'South Indian', latitude: 17.4239, longitude: 78.4738, imageUrl: '/trucks/dosa-delight.webp',
      description: 'Crispy dosas and South Indian breakfast at Tank Bund', estimatedPrepTimeMinutes: 12,
      menu: [
        { name: 'Masala Dosa', price: 129, category: 'Dosa', quantityAvailable: 50, isAvailable: true },
        { name: 'Ghee Roast', price: 169, category: 'Dosa', quantityAvailable: 40, isAvailable: true },
        { name: 'Mysore Dosa', price: 149, category: 'Dosa', quantityAvailable: 40, isAvailable: true },
        { name: 'Cheese Dosa', price: 179, category: 'Dosa', quantityAvailable: 35, isAvailable: true },
        { name: 'Idli (2 pcs)', price: 79, category: 'Breakfast', quantityAvailable: 60, isAvailable: true },
        { name: 'Medu Vada', price: 89, category: 'Breakfast', quantityAvailable: 50, isAvailable: true },
        { name: 'Pongal', price: 129, category: 'Breakfast', quantityAvailable: 40, isAvailable: true },
        { name: 'Filter Coffee', price: 50, category: 'Beverages', quantityAvailable: 80, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Pav Bhaji Express', email: 'pavbhajiexpress@hydstreeteats.com', password: 'pavbhajiexpress123' },
    trucks: [{
      name: 'Pav Bhaji Express', cuisineType: 'Mumbai Street Food', latitude: 17.426, longitude: 78.465, imageUrl: '/trucks/pav-bhaji-express.webp',
      description: 'Mumbai-style pav bhaji and chaat at Necklace Road', estimatedPrepTimeMinutes: 15,
      menu: [
        { name: 'Classic Pav Bhaji', price: 169, category: 'Pav Bhaji', quantityAvailable: 50, isAvailable: true },
        { name: 'Cheese Pav Bhaji', price: 209, category: 'Pav Bhaji', quantityAvailable: 40, isAvailable: true },
        { name: 'Butter Pav Bhaji', price: 199, category: 'Pav Bhaji', quantityAvailable: 40, isAvailable: true },
        { name: 'Tawa Pulao', price: 179, category: 'Rice', quantityAvailable: 35, isAvailable: true },
        { name: 'Masala Pav', price: 119, category: 'Sides', quantityAvailable: 45, isAvailable: true },
        { name: 'Fresh Lime Soda', price: 70, category: 'Beverages', quantityAvailable: 60, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Kathi Rolls King', email: 'kathirollsking@hydstreeteats.com', password: 'kathirollsking123' },
    trucks: [{
      name: 'Kathi Rolls King', cuisineType: 'Rolls & Kathi', latitude: 17.4435, longitude: 78.3772, imageUrl: '/trucks/kathi-rolls-king.webp',
      description: 'Kolkata-style kathi rolls in HITEC City', estimatedPrepTimeMinutes: 12,
      menu: [
        { name: 'Chicken Roll', price: 179, category: 'Rolls', quantityAvailable: 50, isAvailable: true },
        { name: 'Paneer Roll', price: 169, category: 'Rolls', quantityAvailable: 40, isAvailable: true },
        { name: 'Egg Roll', price: 139, category: 'Rolls', quantityAvailable: 45, isAvailable: true },
        { name: 'Double Egg Chicken Roll', price: 229, category: 'Rolls', quantityAvailable: 35, isAvailable: true },
        { name: 'Mutton Roll', price: 249, category: 'Rolls', quantityAvailable: 30, isAvailable: true },
        { name: 'Veg Roll', price: 149, category: 'Rolls', quantityAvailable: 40, isAvailable: true },
        { name: 'French Fries', price: 119, category: 'Sides', quantityAvailable: 50, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Wok on Wheels', email: 'wokonwheels@hydstreeteats.com', password: 'wokonwheels123' },
    trucks: [{
      name: 'Wok on Wheels', cuisineType: 'Chinese', latitude: 17.4474, longitude: 78.3762, imageUrl: '/trucks/wok-on-wheels.webp',
      description: 'Indo-Chinese wok specials near Cyber Towers', estimatedPrepTimeMinutes: 15,
      menu: [
        { name: 'Hakka Noodles', price: 189, category: 'Noodles', quantityAvailable: 45, isAvailable: true },
        { name: 'Schezwan Noodles', price: 209, category: 'Noodles', quantityAvailable: 40, isAvailable: true },
        { name: 'Chicken Fried Rice', price: 219, category: 'Rice', quantityAvailable: 40, isAvailable: true },
        { name: 'Chicken Manchurian', price: 249, category: 'Mains', quantityAvailable: 35, isAvailable: true },
        { name: 'Gobi Manchurian', price: 189, category: 'Mains', quantityAvailable: 35, isAvailable: true },
        { name: 'Spring Rolls', price: 169, category: 'Starters', quantityAvailable: 40, isAvailable: true },
        { name: 'Hot & Sour Soup', price: 149, category: 'Soups', quantityAvailable: 30, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Momo Express', email: 'momoexpress@hydstreeteats.com', password: 'momoexpress123' },
    trucks: [{
      name: 'Momo Express', cuisineType: 'Tibetan', latitude: 17.431, longitude: 78.3915, imageUrl: '/trucks/momo-express.webp',
      description: 'Steamed, fried and tandoori momos at Durgam Cheruvu', estimatedPrepTimeMinutes: 12,
      menu: [
        { name: 'Chicken Momos', price: 189, category: 'Momos', quantityAvailable: 50, isAvailable: true },
        { name: 'Veg Momos', price: 169, category: 'Momos', quantityAvailable: 45, isAvailable: true },
        { name: 'Paneer Momos', price: 189, category: 'Momos', quantityAvailable: 40, isAvailable: true },
        { name: 'Fried Momos', price: 219, category: 'Momos', quantityAvailable: 35, isAvailable: true },
        { name: 'Tandoori Momos', price: 249, category: 'Momos', quantityAvailable: 30, isAvailable: true },
        { name: 'Thukpa', price: 199, category: 'Soups', quantityAvailable: 30, isAvailable: true },
        { name: 'Lemon Tea', price: 70, category: 'Beverages', quantityAvailable: 60, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Thai Spice', email: 'thaispice@hydstreeteats.com', password: 'thaispice123' },
    trucks: [{
      name: 'Thai Spice', cuisineType: 'Thai', latitude: 17.438, longitude: 78.354, imageUrl: '/trucks/thai-spice.webp',
      description: 'Authentic Thai curries and Pad Thai near Botanical Garden', estimatedPrepTimeMinutes: 20,
      menu: [
        { name: 'Pad Thai', price: 289, category: 'Noodles', quantityAvailable: 35, isAvailable: true },
        { name: 'Green Curry', price: 319, category: 'Curries', quantityAvailable: 30, isAvailable: true },
        { name: 'Red Curry', price: 329, category: 'Curries', quantityAvailable: 30, isAvailable: true },
        { name: 'Pineapple Fried Rice', price: 279, category: 'Rice', quantityAvailable: 30, isAvailable: true },
        { name: 'Tom Yum Soup', price: 249, category: 'Soups', quantityAvailable: 25, isAvailable: true },
        { name: 'Thai Iced Tea', price: 139, category: 'Beverages', quantityAvailable: 40, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Ramen Rush', email: 'ramenrush@hydstreeteats.com', password: 'ramenrush123' },
    trucks: [{
      name: 'Ramen Rush', cuisineType: 'Japanese', latitude: 17.428, longitude: 78.345, imageUrl: '/trucks/ramen-rush.webp',
      description: 'Rich broth ramen bowls near Knowledge City', estimatedPrepTimeMinutes: 18,
      menu: [
        { name: 'Tonkotsu Ramen', price: 349, category: 'Ramen', quantityAvailable: 35, isAvailable: true },
        { name: 'Chicken Ramen', price: 319, category: 'Ramen', quantityAvailable: 35, isAvailable: true },
        { name: 'Veg Ramen', price: 279, category: 'Ramen', quantityAvailable: 30, isAvailable: true },
        { name: 'Gyoza', price: 229, category: 'Starters', quantityAvailable: 40, isAvailable: true },
        { name: 'Chicken Karaage', price: 249, category: 'Starters', quantityAvailable: 35, isAvailable: true },
        { name: 'Matcha Latte', price: 179, category: 'Beverages', quantityAvailable: 30, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Sushi Station', email: 'sushistation@hydstreeteats.com', password: 'sushistation123' },
    trucks: [{
      name: 'Sushi Station', cuisineType: 'Japanese', latitude: 17.413, longitude: 78.345, imageUrl: '/trucks/sushi-station.webp',
      description: 'Fresh sushi rolls in the Financial District', estimatedPrepTimeMinutes: 20,
      menu: [
        { name: 'Salmon Sushi', price: 399, category: 'Sushi', quantityAvailable: 25, isAvailable: true },
        { name: 'California Roll', price: 349, category: 'Sushi', quantityAvailable: 30, isAvailable: true },
        { name: 'Veg Sushi', price: 279, category: 'Sushi', quantityAvailable: 30, isAvailable: true },
        { name: 'Tempura Roll', price: 379, category: 'Sushi', quantityAvailable: 25, isAvailable: true },
        { name: 'Chicken Katsu', price: 299, category: 'Mains', quantityAvailable: 30, isAvailable: true },
        { name: 'Matcha Tea', price: 149, category: 'Beverages', quantityAvailable: 35, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Seoul BBQ', email: 'seoulbbq@hydstreeteats.com', password: 'seoulbbq123' },
    trucks: [{
      name: 'Seoul BBQ', cuisineType: 'Korean', latitude: 17.44, longitude: 78.3489, imageUrl: '/trucks/seoul-bbq.webp',
      description: 'Korean BBQ and bibimbap bowls in Gachibowli', estimatedPrepTimeMinutes: 20,
      menu: [
        { name: 'Korean BBQ Chicken', price: 329, category: 'Mains', quantityAvailable: 35, isAvailable: true },
        { name: 'Bibimbap', price: 299, category: 'Rice', quantityAvailable: 35, isAvailable: true },
        { name: 'Kimchi Fried Rice', price: 249, category: 'Rice', quantityAvailable: 35, isAvailable: true },
        { name: 'Tteokbokki', price: 259, category: 'Snacks', quantityAvailable: 30, isAvailable: true },
        { name: 'Korean Fried Chicken', price: 319, category: 'Mains', quantityAvailable: 30, isAvailable: true },
        { name: 'Bubble Tea', price: 179, category: 'Beverages', quantityAvailable: 40, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Bulgogi Box', email: 'bulgogibox@hydstreeteats.com', password: 'bulgogibox123' },
    trucks: [{
      name: 'Bulgogi Box', cuisineType: 'Korean', latitude: 17.453, longitude: 78.382, imageUrl: '/trucks/bulgogi-box.webp',
      description: 'Bulgogi boxes and Korean comfort food at Shilparamam', estimatedPrepTimeMinutes: 20,
      menu: [
        { name: 'Beef Bulgogi', price: 399, category: 'Mains', quantityAvailable: 25, isAvailable: true },
        { name: 'Chicken Bulgogi', price: 329, category: 'Mains', quantityAvailable: 30, isAvailable: true },
        { name: 'Bibimbap', price: 299, category: 'Rice', quantityAvailable: 30, isAvailable: true },
        { name: 'Japchae', price: 279, category: 'Noodles', quantityAvailable: 30, isAvailable: true },
        { name: 'Kimchi Pancakes', price: 249, category: 'Starters', quantityAvailable: 30, isAvailable: true },
        { name: 'Korean Lemon Tea', price: 149, category: 'Beverages', quantityAvailable: 35, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Taco Trail', email: 'tacotrail@hydstreeteats.com', password: 'tacotrail123' },
    trucks: [{
      name: 'Taco Trail', cuisineType: 'Mexican', latitude: 17.434, longitude: 78.382, imageUrl: '/trucks/taco-trail.webp',
      description: 'Street-style tacos near Inorbit Mall', estimatedPrepTimeMinutes: 15,
      menu: [
        { name: 'Chicken Tacos', price: 229, category: 'Tacos', quantityAvailable: 45, isAvailable: true },
        { name: 'Beef Tacos', price: 269, category: 'Tacos', quantityAvailable: 35, isAvailable: true },
        { name: 'Veg Tacos', price: 199, category: 'Tacos', quantityAvailable: 40, isAvailable: true },
        { name: 'Nachos', price: 229, category: 'Sides', quantityAvailable: 35, isAvailable: true },
        { name: 'Burrito', price: 279, category: 'Burritos', quantityAvailable: 30, isAvailable: true },
        { name: 'Churros', price: 149, category: 'Desserts', quantityAvailable: 40, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Burrito Bros', email: 'burritobros@hydstreeteats.com', password: 'burritobros123' },
    trucks: [{
      name: 'Burrito Bros', cuisineType: 'Mexican', latitude: 17.49, longitude: 78.386, imageUrl: '/trucks/burrito-bros.webp',
      description: 'Loaded burritos and bowls at Sarath City Mall', estimatedPrepTimeMinutes: 15,
      menu: [
        { name: 'Chicken Burrito', price: 299, category: 'Burritos', quantityAvailable: 35, isAvailable: true },
        { name: 'Beef Burrito', price: 349, category: 'Burritos', quantityAvailable: 25, isAvailable: true },
        { name: 'Veg Burrito Bowl', price: 269, category: 'Bowls', quantityAvailable: 35, isAvailable: true },
        { name: 'Quesadilla', price: 289, category: 'Mains', quantityAvailable: 30, isAvailable: true },
        { name: 'Loaded Nachos', price: 249, category: 'Sides', quantityAvailable: 35, isAvailable: true },
        { name: 'Horchata', price: 149, category: 'Beverages', quantityAvailable: 40, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Pizza Perfetta', email: 'pizzaperfetta@hydstreeteats.com', password: 'pizzaperfetta123' },
    trucks: [{
      name: 'Pizza Perfetta', cuisineType: 'Italian', latitude: 17.4156, longitude: 78.4347, imageUrl: '/trucks/pizza-perfetta.webp',
      description: 'Wood-fired pizzas in Banjara Hills', estimatedPrepTimeMinutes: 20,
      menu: [
        { name: 'Margherita Pizza', price: 299, category: 'Pizza', quantityAvailable: 30, isAvailable: true },
        { name: 'Farmhouse Pizza', price: 379, category: 'Pizza', quantityAvailable: 25, isAvailable: true },
        { name: 'BBQ Chicken Pizza', price: 429, category: 'Pizza', quantityAvailable: 25, isAvailable: true },
        { name: 'Pepperoni Pizza', price: 449, category: 'Pizza', quantityAvailable: 25, isAvailable: true },
        { name: 'Garlic Bread', price: 169, category: 'Sides', quantityAvailable: 35, isAvailable: true },
        { name: 'Tiramisu', price: 219, category: 'Desserts', quantityAvailable: 25, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Pasta Paradise', email: 'pastaparadise@hydstreeteats.com', password: 'pastaparadise123' },
    trucks: [{
      name: 'Pasta Paradise', cuisineType: 'Italian', latitude: 17.4326, longitude: 78.4071, imageUrl: '/trucks/pasta-paradise.webp',
      description: 'Fresh pasta and Italian comfort food in Jubilee Hills', estimatedPrepTimeMinutes: 20,
      menu: [
        { name: 'Fettuccine Alfredo', price: 329, category: 'Pasta', quantityAvailable: 30, isAvailable: true },
        { name: 'Penne Arrabbiata', price: 289, category: 'Pasta', quantityAvailable: 30, isAvailable: true },
        { name: 'Spaghetti Carbonara', price: 359, category: 'Pasta', quantityAvailable: 25, isAvailable: true },
        { name: 'Truffle Pasta', price: 449, category: 'Pasta', quantityAvailable: 20, isAvailable: true },
        { name: 'Lasagna', price: 379, category: 'Mains', quantityAvailable: 25, isAvailable: true },
        { name: 'Garlic Bread', price: 169, category: 'Sides', quantityAvailable: 35, isAvailable: true },
        { name: 'Bruschetta', price: 189, category: 'Starters', quantityAvailable: 30, isAvailable: true },
        { name: 'Tiramisu', price: 229, category: 'Desserts', quantityAvailable: 25, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Burger Bay', email: 'burgerbay@hydstreeteats.com', password: 'burgerbay123' },
    trucks: [{
      name: 'Burger Bay', cuisineType: 'Burgers', latitude: 17.4435, longitude: 78.3772, imageUrl: '/trucks/burger-bay.webp',
      description: 'Smash burgers and loaded fries in HITEC City', estimatedPrepTimeMinutes: 15,
      menu: [
        { name: 'Classic Cheeseburger', price: 269, category: 'Burgers', quantityAvailable: 40, isAvailable: true },
        { name: 'Double Smash Burger', price: 359, category: 'Burgers', quantityAvailable: 30, isAvailable: true },
        { name: 'Crispy Chicken Burger', price: 299, category: 'Burgers', quantityAvailable: 35, isAvailable: true },
        { name: 'Veg Burger', price: 229, category: 'Burgers', quantityAvailable: 35, isAvailable: true },
        { name: 'Loaded Fries', price: 199, category: 'Sides', quantityAvailable: 40, isAvailable: true },
        { name: 'Onion Rings', price: 169, category: 'Sides', quantityAvailable: 35, isAvailable: true },
        { name: 'Chocolate Shake', price: 189, category: 'Beverages', quantityAvailable: 30, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Wings on Wheels', email: 'wingsonwheels@hydstreeteats.com', password: 'wingsonwheels123' },
    trucks: [{
      name: 'Wings on Wheels', cuisineType: 'American', latitude: 17.431, longitude: 78.3915, imageUrl: '/trucks/wings-on-wheels.webp',
      description: 'Loaded wings and tenders at Durgam Cheruvu', estimatedPrepTimeMinutes: 18,
      menu: [
        { name: 'Buffalo Wings', price: 299, category: 'Wings', quantityAvailable: 40, isAvailable: true },
        { name: 'Honey BBQ Wings', price: 319, category: 'Wings', quantityAvailable: 35, isAvailable: true },
        { name: 'Peri Peri Wings', price: 299, category: 'Wings', quantityAvailable: 35, isAvailable: true },
        { name: 'Garlic Parmesan Wings', price: 329, category: 'Wings', quantityAvailable: 30, isAvailable: true },
        { name: 'Chicken Tenders', price: 249, category: 'Mains', quantityAvailable: 35, isAvailable: true },
        { name: 'Chicken Popcorn', price: 199, category: 'Snacks', quantityAvailable: 40, isAvailable: true },
        { name: 'Loaded Fries', price: 189, category: 'Sides', quantityAvailable: 35, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'BBQ Smokehouse', email: 'bbqsmokehouse@hydstreeteats.com', password: 'bbqsmokehouse123' },
    trucks: [{
      name: 'BBQ Smokehouse', cuisineType: 'BBQ', latitude: 17.403, longitude: 78.352, imageUrl: '/trucks/bbq-smokehouse.webp',
      description: 'Slow-smoked BBQ in Khajaguda', estimatedPrepTimeMinutes: 25,
      menu: [
        { name: 'Smoked BBQ Chicken', price: 349, category: 'Mains', quantityAvailable: 30, isAvailable: true },
        { name: 'BBQ Ribs', price: 499, category: 'Mains', quantityAvailable: 20, isAvailable: true },
        { name: 'Pulled Chicken Burger', price: 299, category: 'Burgers', quantityAvailable: 30, isAvailable: true },
        { name: 'Smoked Wings', price: 299, category: 'Wings', quantityAvailable: 30, isAvailable: true },
        { name: 'Grilled Corn', price: 149, category: 'Sides', quantityAvailable: 35, isAvailable: true },
        { name: 'Loaded Fries', price: 199, category: 'Sides', quantityAvailable: 35, isAvailable: true },
        { name: 'Chocolate Shake', price: 189, category: 'Beverages', quantityAvailable: 30, isAvailable: true },
      ],
    }],
  },
  {
    vendor: { name: 'Waffle House Express', email: 'wafflehouseexpress@hydstreeteats.com', password: 'wafflehouseexp123' },
    trucks: [{
      name: 'Waffle House Express', cuisineType: 'Desserts', latitude: 17.426, longitude: 78.465, imageUrl: '/trucks/waffle-house-express.webp',
      description: 'Belgian waffles and dessert shakes at Necklace Road', estimatedPrepTimeMinutes: 12,
      menu: [
        { name: 'Belgian Waffle', price: 249, category: 'Waffles', quantityAvailable: 40, isAvailable: true },
        { name: 'Nutella Waffle', price: 299, category: 'Waffles', quantityAvailable: 35, isAvailable: true },
        { name: 'Strawberry Waffle', price: 289, category: 'Waffles', quantityAvailable: 35, isAvailable: true },
        { name: 'Oreo Waffle', price: 299, category: 'Waffles', quantityAvailable: 35, isAvailable: true },
        { name: 'Mini Pancakes', price: 229, category: 'Desserts', quantityAvailable: 40, isAvailable: true },
        { name: 'Brownie Sundae', price: 249, category: 'Desserts', quantityAvailable: 30, isAvailable: true },
        { name: 'Thick Milkshake', price: 199, category: 'Beverages', quantityAvailable: 40, isAvailable: true },
        { name: 'Hot Chocolate', price: 179, category: 'Beverages', quantityAvailable: 35, isAvailable: true },
      ],
    }],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const esc = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const now = 'NOW(6)';

// ---------------------------------------------------------------------------
// Generate SQL
// ---------------------------------------------------------------------------
let authSql = [];
let truckSql = [];
let menuSql = [];
let menuItemId = 1;
let truckId = 1;

for (let i = 0; i < VENDORS.length; i++) {
  const { vendor, trucks } = VENDORS[i];
  const userId = 2001 + i; // explicit, above current max user id to avoid collisions

  const hash = bcrypt.hashSync(vendor.password, 10);

  authSql.push(
    `INSERT INTO users (id, created_at, email, name, password, role) VALUES ` +
    `(${userId}, ${now}, ${esc(vendor.email)}, ${esc(vendor.name)}, ${esc(hash)}, 'VENDOR');`
  );

  for (const truck of trucks) {
    truckSql.push(
      `INSERT INTO trucks (id, created_at, cuisine_type, description, image_url, latitude, longitude, name, owner_id, status, updated_at, average_rating, estimated_prep_time_minutes) VALUES ` +
      `(${truckId}, ${now}, ${esc(truck.cuisineType)}, ${esc(truck.description ?? null)}, ${esc(truck.imageUrl ?? null)}, ${truck.latitude}, ${truck.longitude}, ${esc(truck.name)}, ${userId}, 'OPEN', ${now}, 0.0, ${truck.estimatedPrepTimeMinutes});`
    );

    for (const item of truck.menu) {
      menuSql.push(
        `INSERT INTO menu_items (id, category, created_at, description, image_url, is_available, name, price, quantity_available, truck_id) VALUES ` +
        `(${menuItemId}, ${esc(item.category)}, ${now}, ${esc(item.description ?? null)}, NULL, ${item.isAvailable ? 1 : 0}, ${esc(item.name)}, ${item.price}, ${item.quantityAvailable}, ${truckId});`
      );
      menuItemId++;
    }
    truckId++;
  }
}

// ---------------------------------------------------------------------------
// Write SQL files
// ---------------------------------------------------------------------------
fs.writeFileSync(path.join(process.cwd(), 'seed-auth.sql'), authSql.join('\n') + '\n');
fs.writeFileSync(path.join(process.cwd(), 'seed-truck.sql'), truckSql.join('\n') + '\n');
fs.writeFileSync(path.join(process.cwd(), 'seed-menu.sql'), menuSql.join('\n') + '\n');

console.log(`Generated SQL files in ${process.cwd()}`);
console.log(`  vendors     : ${VENDORS.length}`);
console.log(`  trucks      : ${truckId - 1}`);
console.log(`  menu items  : ${menuItemId - 1}`);
