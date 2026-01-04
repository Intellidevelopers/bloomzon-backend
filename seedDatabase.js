const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Category, Subcategory, DropdownData } = require('./src/models/Product');

/**
 * Seed script to populate initial dropdown data
 * Run: npm run seed
 */

const seedDropdownData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // ============================================
    // SEED CATEGORIES AND SUBCATEGORIES
    // ============================================
    console.log('📁 Seeding categories and subcategories...');

    const categoriesData = [
      {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        subcategories: [
          'Mobile Phones',
          'Laptops',
          'Tablets',
          'Cameras',
          'Audio & Headphones',
          'Smart Watches',
          'Gaming Consoles',
          'Televisions',
          'Computer Accessories',
          'Power Banks'
        ]
      },
      {
        name: 'Clothing',
        description: 'Fashion and apparel',
        subcategories: [
          "Men's Clothing",
          "Women's Clothing",
          "Kids' Clothing",
          'Shoes',
          'Accessories',
          'Sportswear',
          'Underwear & Sleepwear',
          'Bags & Luggage',
          'Jewelry',
          'Watches'
        ]
      },
      {
        name: 'Home Appliances',
        description: 'Household appliances',
        subcategories: [
          'Kitchen Appliances',
          'Cleaning Appliances',
          'Air Conditioners',
          'Refrigerators',
          'Washing Machines',
          'Microwaves',
          'Blenders & Mixers',
          'Irons & Steamers',
          'Water Dispensers',
          'Fans & Heaters'
        ]
      },
      {
        name: 'Furniture',
        description: 'Home and office furniture',
        subcategories: [
          'Living Room',
          'Bedroom',
          'Office',
          'Outdoor',
          'Dining Room',
          'Storage & Organization',
          'Kids Furniture',
          'Lighting'
        ]
      },
      {
        name: 'Beauty & Health',
        description: 'Beauty and health products',
        subcategories: [
          'Skincare',
          'Makeup',
          'Hair Care',
          'Fragrances',
          'Personal Care',
          'Vitamins & Supplements',
          'Medical Supplies',
          'Fitness Equipment'
        ]
      },
      {
        name: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear',
        subcategories: [
          'Exercise & Fitness',
          'Outdoor Recreation',
          'Sports Equipment',
          'Cycling',
          'Water Sports',
          'Team Sports',
          'Camping & Hiking',
          'Fishing'
        ]
      },
      {
        name: 'Books & Media',
        description: 'Books, music, and entertainment',
        subcategories: [
          'Books',
          'Music',
          'Movies & TV',
          'Video Games',
          'Magazines',
          'Educational Materials',
          'E-Books',
          'Audio Books'
        ]
      },
      {
        name: 'Toys & Games',
        description: 'Toys and games for all ages',
        subcategories: [
          'Action Figures',
          'Dolls',
          'Board Games',
          'Puzzles',
          'Educational Toys',
          'Building Sets',
          'Remote Control',
          'Outdoor Toys'
        ]
      },
      {
        name: 'Automotive',
        description: 'Auto parts and accessories',
        subcategories: [
          'Car Accessories',
          'Car Electronics',
          'Car Care',
          'Tools & Equipment',
          'Motorcycle Accessories',
          'Tires & Wheels'
        ]
      },
      {
        name: 'Baby Products',
        description: 'Products for babies and toddlers',
        subcategories: [
          'Baby Clothing',
          'Feeding',
          'Diapers & Wipes',
          'Baby Care',
          'Baby Furniture',
          'Toys',
          'Strollers',
          'Car Seats'
        ]
      }
    ];

    // Clear existing categories
    await Category.deleteMany({});
    await Subcategory.deleteMany({});

    for (let i = 0; i < categoriesData.length; i++) {
      const categoryData = categoriesData[i];
      
      // Create category
      const category = await Category.create({
        name: categoryData.name,
        slug: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: categoryData.description,
        order: i + 1,
        isActive: true
      });

      console.log(`  ✅ Created category: ${category.name}`);

      // Create subcategories
      for (let j = 0; j < categoryData.subcategories.length; j++) {
        const subcategoryName = categoryData.subcategories[j];
        const subcategory = await Subcategory.create({
          name: subcategoryName,
          slug: subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          categoryId: category._id,
          order: j + 1,
          isActive: true
        });
        console.log(`     ↳ ${subcategory.name}`);
      }
    }

    console.log('\n✅ Categories and subcategories seeded successfully!\n');

    // ============================================
    // SEED DROPDOWN DATA
    // ============================================

    const dropdownSets = [
      {
        type: 'productIdType',
        label: 'Product ID Types',
        data: [
          { name: 'UPC', description: 'Universal Product Code', value: 'UPC' },
          { name: 'EAN', description: 'European Article Number', value: 'EAN' },
          { name: 'ISBN', description: 'International Standard Book Number', value: 'ISBN' },
          { name: 'GTIN', description: 'Global Trade Item Number', value: 'GTIN' },
          { name: 'ASIN', description: 'Amazon Standard Identification Number', value: 'ASIN' }
        ]
      },
      {
        type: 'condition',
        label: 'Product Conditions',
        data: [
          { name: 'New', description: 'Brand new, unused product in original packaging', value: 'New' },
          { name: 'Used - Like New', description: 'Previously used but in excellent condition', value: 'Used - Like New' },
          { name: 'Used - Good', description: 'Previously used with minor signs of wear', value: 'Used - Good' },
          { name: 'Used - Acceptable', description: 'Previously used with noticeable signs of wear', value: 'Used - Acceptable' },
          { name: 'Refurbished', description: 'Professionally restored to working condition', value: 'Refurbished' },
          { name: 'Open Box', description: 'Product packaging opened but item is unused', value: 'Open Box' }
        ]
      },
      {
        type: 'closureType',
        label: 'Closure Types',
        data: [
          { name: 'Zipper', value: 'Zipper' },
          { name: 'Button', value: 'Button' },
          { name: 'Velcro', value: 'Velcro' },
          { name: 'Snap', value: 'Snap' },
          { name: 'Lace-up', value: 'Lace-up' },
          { name: 'Buckle', value: 'Buckle' },
          { name: 'Hook and Eye', value: 'Hook and Eye' },
          { name: 'Elastic', value: 'Elastic' },
          { name: 'Drawstring', value: 'Drawstring' },
          { name: 'Magnetic', value: 'Magnetic' }
        ]
      },
      {
        type: 'outerMaterial',
        label: 'Outer Materials',
        data: [
          { name: 'Leather', value: 'Leather' },
          { name: 'Cotton', value: 'Cotton' },
          { name: 'Polyester', value: 'Polyester' },
          { name: 'Nylon', value: 'Nylon' },
          { name: 'Canvas', value: 'Canvas' },
          { name: 'Suede', value: 'Suede' },
          { name: 'Denim', value: 'Denim' },
          { name: 'Silk', value: 'Silk' },
          { name: 'Wool', value: 'Wool' },
          { name: 'Linen', value: 'Linen' },
          { name: 'Synthetic', value: 'Synthetic' },
          { name: 'Rubber', value: 'Rubber' },
          { name: 'Mesh', value: 'Mesh' },
          { name: 'Metal', value: 'Metal' },
          { name: 'Plastic', value: 'Plastic' }
        ]
      },
      {
        type: 'style',
        label: 'Styles',
        data: [
          { name: 'Casual', value: 'Casual' },
          { name: 'Formal', value: 'Formal' },
          { name: 'Sport', value: 'Sport' },
          { name: 'Vintage', value: 'Vintage' },
          { name: 'Modern', value: 'Modern' },
          { name: 'Classic', value: 'Classic' },
          { name: 'Bohemian', value: 'Bohemian' },
          { name: 'Minimalist', value: 'Minimalist' },
          { name: 'Streetwear', value: 'Streetwear' },
          { name: 'Business', value: 'Business' },
          { name: 'Athletic', value: 'Athletic' },
          { name: 'Elegant', value: 'Elegant' }
        ]
      },
      {
        type: 'gender',
        label: 'Gender',
        data: [
          { name: 'Male', value: 'Male' },
          { name: 'Female', value: 'Female' },
          { name: 'Unisex', value: 'Unisex' },
          { name: 'Rather not to say', value: 'Rather not to say' }
        ]
      },
      {
        type: 'strapType',
        label: 'Strap Types',
        data: [
          { name: 'Adjustable', value: 'Adjustable' },
          { name: 'Fixed', value: 'Fixed' },
          { name: 'Detachable', value: 'Detachable' },
          { name: 'Chain', value: 'Chain' },
          { name: 'Leather', value: 'Leather' },
          { name: 'Fabric', value: 'Fabric' },
          { name: 'Metal', value: 'Metal' },
          { name: 'Rubber', value: 'Rubber' },
          { name: 'Silicone', value: 'Silicone' }
        ]
      },
      {
        type: 'country',
        label: 'Countries',
        data: [
          { name: 'Nigeria', code: 'NG', value: 'Nigeria' },
          { name: 'United Kingdom', code: 'GB', value: 'United Kingdom' },
          { name: 'United States', code: 'US', value: 'United States' },
          { name: 'Canada', code: 'CA', value: 'Canada' },
          { name: 'Germany', code: 'DE', value: 'Germany' },
          { name: 'France', code: 'FR', value: 'France' },
          { name: 'China', code: 'CN', value: 'China' },
          { name: 'India', code: 'IN', value: 'India' },
          { name: 'Australia', code: 'AU', value: 'Australia' },
          { name: 'South Africa', code: 'ZA', value: 'South Africa' },
          { name: 'Ghana', code: 'GH', value: 'Ghana' },
          { name: 'Kenya', code: 'KE', value: 'Kenya' },
          { name: 'Brazil', code: 'BR', value: 'Brazil' },
          { name: 'Japan', code: 'JP', value: 'Japan' },
          { name: 'South Korea', code: 'KR', value: 'South Korea' }
        ]
      },
      {
        type: 'fulfillmentChannel',
        label: 'Fulfillment Channels',
        data: [
          { 
            name: 'Bloomzon Ship',
            value: 'Bloomzon Ship',
            description: 'You store your products in the nearest Bloomzon warehouse, and we take care of shipping to your customers.'
          },
          { 
            name: 'Bloomzon Pickup',
            value: 'Bloomzon Pickup',
            description: 'You store and pack orders at your location. We pick them up from the provided address and deliver them to customers.'
          },
          { 
            name: 'Self Ship',
            value: 'Self Ship',
            description: 'You store and pack orders at your location. Then, you deliver them to customers yourself or use a third-party courier.'
          }
        ]
      }
    ];

    for (const set of dropdownSets) {
      console.log(`📋 Seeding ${set.label}...`);
      await DropdownData.deleteMany({ type: set.type });
      
      for (let i = 0; i < set.data.length; i++) {
        await DropdownData.create({
          type: set.type,
          ...set.data[i],
          order: i + 1
        });
      }
      console.log(`  ✅ Seeded ${set.data.length} ${set.label}\n`);
    }

    console.log('✅ All dropdown data seeded successfully!\n');
    console.log('🎉 Database seeding completed!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://adeagbojosiah1_db_user:t2TZ4XXm6I4gP5p2@bloomzoncluster.ppygely.mongodb.net/?appName=BloomzonCluster';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('📦 Connected to MongoDB\n');
      return seedDropdownData();
    })
    .then(() => {
      console.log('👋 Seeding complete, closing connection...');
      return mongoose.connection.close();
    })
    .then(() => {
      console.log('✅ Connection closed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = seedDropdownData;