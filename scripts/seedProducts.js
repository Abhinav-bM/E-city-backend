import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { BASE_PRODUCT, PRODUCT_VARIANT } from "../models/product-model.js";
import { Category } from "../models/category-model.js";
import Brand from "../models/brand-model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Clear all products
const clearProducts = async () => {
  await BASE_PRODUCT.deleteMany({});
  await PRODUCT_VARIANT.deleteMany({});
  console.log("🗑️  All products cleared");
};

// Ensure categories and brands exist
const seedCategoriesAndBrands = async () => {
  const categories = [
    { name: "Mobile", slug: "mobile", isFeatured: true },
    { name: "Laptop", slug: "laptop", isFeatured: true },
    { name: "Tablet", slug: "tablet", isFeatured: false },
    { name: "Accessories", slug: "accessories", isFeatured: true },
    { name: "Smartwatch", slug: "smartwatch", isFeatured: false },
  ];

  const brands = [
    "Apple",
    "Samsung",
    "Google",
    "OnePlus",
    "Dell",
    "HP",
    "Lenovo",
    "Sony",
  ];

  for (const cat of categories) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, {
      upsert: true,
      new: true,
    });
  }

  for (const brandName of brands) {
    const slug = brandName.toLowerCase().replace(/\s+/g, "-");
    await Brand.findOneAndUpdate(
      { name: brandName },
      { name: brandName, slug },
      {
        upsert: true,
        new: true,
      },
    );
  }

  console.log("✅ Categories and brands ensured");
  return { categories, brands };
};

// Product seed data
const createProducts = async () => {
  const mobileCategory = await Category.findOne({ slug: "mobile" });
  const laptopCategory = await Category.findOne({ slug: "laptop" });
  const tabletCategory = await Category.findOne({ slug: "tablet" });
  const accessoryCategory = await Category.findOne({ slug: "accessories" });
  const smartwatchCategory = await Category.findOne({ slug: "smartwatch" });

  const products = [
    // === MOBILE PHONES ===
    {
      base: {
        title: "iPhone 15 Pro",
        brand: "Apple",
        description:
          "Titanium design. A17 Pro chip. Action button. USB-C. All-new camera system.",
        category: mobileCategory._id,
        isFeatured: true,
        isNewArrival: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1695048064030-19257e3b6a3d?w=800",
          },
        ],
        variantAttributes: [
          {
            name: "Color",
            values: ["Black Titanium", "Blue Titanium", "Natural Titanium"],
          },
          { name: "Storage", values: ["128GB", "256GB", "512GB"] },
        ],
        specifications: [
          {
            group: "Display",
            items: [
              { key: "Size", value: "6.1-inch Super Retina XDR" },
              { key: "Resolution", value: "2556 x 1179 pixels" },
              { key: "Refresh Rate", value: "ProMotion 120Hz" },
            ],
          },
          {
            group: "Performance",
            items: [
              { key: "Chip", value: "A17 Pro" },
              { key: "RAM", value: "8GB" },
            ],
          },
        ],
      },
      variants: [
        {
          attributes: { Color: "Black Titanium", Storage: "128GB" },
          sellingPrice: 129900,
          actualPrice: 134900,
          stock: 15,
        },
        {
          attributes: { Color: "Black Titanium", Storage: "256GB" },
          sellingPrice: 139900,
          actualPrice: 144900,
          stock: 12,
        },
        {
          attributes: { Color: "Blue Titanium", Storage: "256GB" },
          sellingPrice: 139900,
          actualPrice: 144900,
          stock: 8,
        },
        {
          attributes: { Color: "Natural Titanium", Storage: "512GB" },
          sellingPrice: 169900,
          actualPrice: 174900,
          stock: 4,
        },
      ],
    },

    {
      base: {
        title: "Samsung Galaxy S24 Ultra",
        brand: "Samsung",
        description:
          "Built-in S Pen. AI-powered camera. Titanium build. Snapdragon 8 Gen 3.",
        category: mobileCategory._id,
        isFeatured: true,
        isNewArrival: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800",
          },
        ],
        variantAttributes: [
          { name: "Color", values: ["Titanium Gray", "Titanium Violet"] },
          { name: "Storage", values: ["256GB", "512GB"] },
        ],
        specifications: [
          {
            group: "Display",
            items: [
              { key: "Size", value: "6.8-inch Dynamic AMOLED 2X" },
              { key: "Resolution", value: "3120 x 1440 pixels" },
            ],
          },
        ],
      },
      variants: [
        {
          attributes: { Color: "Titanium Gray", Storage: "256GB" },
          sellingPrice: 124999,
          actualPrice: 129999,
          stock: 20,
        },
        {
          attributes: { Color: "Titanium Violet", Storage: "512GB" },
          sellingPrice: 144999,
          actualPrice: 149999,
          stock: 10,
        },
      ],
    },

    {
      base: {
        title: "Google Pixel 8 Pro",
        brand: "Google",
        description:
          "Google Tensor G3. Best AI features. Magic Editor. Best Take. Night Sight.",
        category: mobileCategory._id,
        isNewArrival: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800",
          },
        ],
        variantAttributes: [
          { name: "Color", values: ["Obsidian", "Porcelain", "Bay"] },
          { name: "Storage", values: ["128GB", "256GB"] },
        ],
      },
      variants: [
        {
          attributes: { Color: "Obsidian", Storage: "128GB" },
          sellingPrice: 106999,
          actualPrice: 106999,
          stock: 14,
        },
        {
          attributes: { Color: "Porcelain", Storage: "256GB" },
          sellingPrice: 116999,
          actualPrice: 119999,
          stock: 6,
        },
      ],
    },

    // Refurbished Mobile
    {
      base: {
        title: "iPhone 14 (Refurbished)",
        brand: "Apple",
        description:
          "Certified refurbished iPhone 14. Like new condition. 6 months warranty.",
        category: mobileCategory._id,
        images: [
          {
            url: "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=800",
          },
        ],
      },
      variants: [
        {
          attributes: {},
          sellingPrice: 54990,
          compareAtPrice: 79900,
          stock: 5,
          condition: "Refurbished",
          conditionGrade: "Excellent",
          conditionDescription:
            "Minor cosmetic wear on edges. Screen is perfect.",
          inventoryType: "Unique",
        },
      ],
    },

    // === LAPTOPS ===
    {
      base: {
        title: "MacBook Pro 14-inch",
        brand: "Apple",
        description:
          "M3, M3 Pro or M3 Max chip. Up to 22 hours battery. Liquid Retina XDR display.",
        category: laptopCategory._id,
        isFeatured: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
          },
        ],
        variantAttributes: [
          { name: "Chip", values: ["M3", "M3 Pro"] },
          { name: "RAM", values: ["8GB", "16GB"] },
        ],
        specifications: [
          {
            group: "Display",
            items: [
              { key: "Size", value: "14.2-inch Liquid Retina XDR" },
              { key: "Resolution", value: "3024 x 1964 pixels" },
            ],
          },
        ],
      },
      variants: [
        {
          attributes: { Chip: "M3", RAM: "8GB" },
          sellingPrice: 169900,
          actualPrice: 169900,
          stock: 8,
        },
        {
          attributes: { Chip: "M3 Pro", RAM: "16GB" },
          sellingPrice: 239900,
          actualPrice: 239900,
          stock: 4,
        },
      ],
    },

    {
      base: {
        title: "Dell XPS 13",
        brand: "Dell",
        description:
          "13th Gen Intel Core i7. InfinityEdge display. Premium aluminum build.",
        category: laptopCategory._id,
        isFeatured: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800",
          },
        ],
        variantAttributes: [
          { name: "RAM", values: ["16GB", "32GB"] },
          { name: "Storage", values: ["512GB SSD", "1TB SSD"] },
        ],
      },
      variants: [
        {
          attributes: { RAM: "16GB", Storage: "512GB SSD" },
          sellingPrice: 129990,
          actualPrice: 139990,
          stock: 12,
        },
        {
          attributes: { RAM: "32GB", Storage: "1TB SSD" },
          sellingPrice: 159990,
          actualPrice: 169990,
          stock: 6,
        },
      ],
    },

    // Refurbished Laptop
    {
      base: {
        title: "MacBook Air M2 (Refurbished)",
        brand: "Apple",
        description:
          "Certified refurbished. M2 chip. 13.6-inch display. Excellent condition.",
        category: laptopCategory._id,
        images: [
          {
            url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
          },
        ],
      },
      variants: [
        {
          attributes: {},
          sellingPrice: 89990,
          compareAtPrice: 114900,
          stock: 3,
          condition: "Refurbished",
          conditionGrade: "Like New",
          conditionDescription: "Perfect condition. Original box included.",
          inventoryType: "Unique",
        },
      ],
    },

    // Open Box Laptop
    {
      base: {
        title: "HP Pavilion 15 (Open Box)",
        brand: "HP",
        description:
          "AMD Ryzen 5. 15.6-inch FHD. Open box, never used. Full warranty.",
        category: laptopCategory._id,
        images: [
          {
            url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
          },
        ],
      },
      variants: [
        {
          attributes: {},
          sellingPrice: 54990,
          compareAtPrice: 64990,
          stock: 2,
          condition: "Open Box",
          conditionGrade: "Excellent",
          conditionDescription:
            "Original packaging damaged. Product is brand new.",
          inventoryType: "Unique",
        },
      ],
    },

    // === TABLETS ===
    {
      base: {
        title: "iPad Pro 12.9-inch",
        brand: "Apple",
        description:
          "M2 chip. 12.9-inch Liquid Retina XDR. Apple Pencil support.",
        category: tabletCategory._id,
        isFeatured: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
          },
        ],
        variantAttributes: [
          { name: "Storage", values: ["128GB", "256GB", "512GB"] },
          { name: "Connectivity", values: ["Wi-Fi", "Wi-Fi + Cellular"] },
        ],
      },
      variants: [
        {
          attributes: { Storage: "128GB", Connectivity: "Wi-Fi" },
          sellingPrice: 112900,
          actualPrice: 112900,
          stock: 10,
        },
        {
          attributes: { Storage: "256GB", Connectivity: "Wi-Fi + Cellular" },
          sellingPrice: 156900,
          actualPrice: 156900,
          stock: 5,
        },
      ],
    },

    {
      base: {
        title: "Samsung Galaxy Tab S9",
        brand: "Samsung",
        description:
          "Dynamic AMOLED 2X. S Pen included. IP68 water resistance.",
        category: tabletCategory._id,
        images: [
          {
            url: "https://images.unsplash.com/photo-1585789575743-07e9e7a5d291?w=800",
          },
        ],
        variantAttributes: [{ name: "Storage", values: ["128GB", "256GB"] }],
      },
      variants: [
        {
          attributes: { Storage: "128GB" },
          sellingPrice: 74999,
          actualPrice: 79999,
          stock: 8,
        },
        {
          attributes: { Storage: "256GB" },
          sellingPrice: 84999,
          actualPrice: 89999,
          stock: 4,
        },
      ],
    },

    // === ACCESSORIES ===
    {
      base: {
        title: "AirPods Pro (2nd Generation)",
        brand: "Apple",
        description:
          "Active Noise Cancellation. Adaptive Audio. USB-C charging.",
        category: accessoryCategory._id,
        isFeatured: true,
        isNewArrival: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800",
          },
        ],
      },
      variants: [
        { attributes: {}, sellingPrice: 24900, actualPrice: 24900, stock: 25 },
      ],
    },

    {
      base: {
        title: "Samsung Galaxy Buds2 Pro",
        brand: "Samsung",
        description: "Intelligent ANC. 360 Audio. IPX7 water resistance.",
        category: accessoryCategory._id,
        images: [
          {
            url: "https://images.unsplash.com/photo-1590658165737-15a047b7e9f3?w=800",
          },
        ],
        variantAttributes: [
          { name: "Color", values: ["Graphite", "White", "Bora Purple"] },
        ],
      },
      variants: [
        {
          attributes: { Color: "Graphite" },
          sellingPrice: 17999,
          actualPrice: 19999,
          stock: 15,
        },
        {
          attributes: { Color: "White" },
          sellingPrice: 17999,
          actualPrice: 19999,
          stock: 12,
        },
        {
          attributes: { Color: "Bora Purple" },
          sellingPrice: 17999,
          actualPrice: 19999,
          stock: 3,
        },
      ],
    },

    // Refurbished Accessory
    {
      base: {
        title: "AirPods (Refurbished)",
        brand: "Apple",
        description:
          "Certified refurbished AirPods 3rd Gen. 6 months warranty.",
        category: accessoryCategory._id,
        images: [
          {
            url: "https://images.unsplash.com/photo-1606841739539-7bffb073b68f?w=800",
          },
        ],
      },
      variants: [
        {
          attributes: {},
          sellingPrice: 7999,
          compareAtPrice: 12900,
          stock: 6,
          condition: "Refurbished",
          conditionGrade: "Excellent",
          conditionDescription: "Fully functional. Cleaned and tested.",
          inventoryType: "Unique",
        },
      ],
    },

    // === SMARTWATCHES ===
    {
      base: {
        title: "Apple Watch Series 9",
        brand: "Apple",
        description:
          "Advanced health sensors. Always-On Retina display. S9 chip.",
        category: smartwatchCategory._id,
        isFeatured: true,
        isNewArrival: true,
        images: [
          {
            url: "https://images.unsplash.com/photo-1579721840641-7d0e67f1204e?w=800",
          },
        ],
        variantAttributes: [
          { name: "Size", values: ["41mm", "45mm"] },
          { name: "Band", values: ["Sport Band", "Braided Loop"] },
        ],
      },
      variants: [
        {
          attributes: { Size: "41mm", Band: "Sport Band" },
          sellingPrice: 41900,
          actualPrice: 41900,
          stock: 18,
        },
        {
          attributes: { Size: "45mm", Band: "Braided Loop" },
          sellingPrice: 49900,
          actualPrice: 49900,
          stock: 7,
        },
      ],
    },

    // Refurbished Smartwatch
    {
      base: {
        title: "Apple Watch SE (Refurbished)",
        brand: "Apple",
        description: "Certified refurbished. 40mm. GPS. Like new condition.",
        category: smartwatchCategory._id,
        images: [
          {
            url: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=800",
          },
        ],
      },
      variants: [
        {
          attributes: {},
          sellingPrice: 19990,
          compareAtPrice: 29900,
          stock: 4,
          condition: "Refurbished",
          conditionGrade: "Like New",
          conditionDescription:
            "Perfect working condition. Minor signs of use.",
          inventoryType: "Unique",
        },
      ],
    },
  ];

  // Helper to generate 100+ products by duplicating and varying templates
  const baseTemplates = [...products];
  while (products.length < 100) {
    const template =
      baseTemplates[Math.floor(Math.random() * baseTemplates.length)];
    const clone = JSON.parse(JSON.stringify(template));

    // Vary the title and SKU-related properties
    const suffix = products.length + 1;
    clone.base.title = `${clone.base.title} (Batch ${suffix})`;

    // Randomly set featured/new arrival
    clone.base.isFeatured = Math.random() > 0.7;
    clone.base.isNewArrival = Math.random() > 0.7;

    products.push(clone);
  }

  let createdCount = 0;
  for (const productData of products) {
    try {
      // Create base product
      const baseProduct = await BASE_PRODUCT.create(productData.base);

      // Create variants
      for (let i = 0; i < productData.variants.length; i++) {
        const variantData = productData.variants[i];

        // Generate title
        let variantTitle = baseProduct.title;
        if (Object.keys(variantData.attributes).length > 0) {
          variantTitle +=
            " - " + Object.values(variantData.attributes).join(" / ");
        }

        // Generate SKU
        const sku = `SKU-${baseProduct.brand.toUpperCase()}-${Date.now()}-${i}`;

        await PRODUCT_VARIANT.create({
          baseProductId: baseProduct._id,
          title: variantTitle,
          attributes: variantData.attributes,
          sellingPrice: variantData.sellingPrice,
          actualPrice: variantData.actualPrice || variantData.sellingPrice,
          compareAtPrice:
            variantData.compareAtPrice ||
            variantData.actualPrice ||
            variantData.sellingPrice,
          stock: variantData.stock,
          sku,
          condition: variantData.condition || "New",
          conditionGrade: variantData.conditionGrade,
          conditionDescription: variantData.conditionDescription,
          inventoryType: variantData.inventoryType || "Quantity",
          isDefault: i === 0,
        });
      }

      createdCount++;
      console.log(
        `✅ Created: ${baseProduct.title} with ${productData.variants.length} variant(s)`,
      );
    } catch (error) {
      console.error(`❌ Failed to create product:`, error.message);
    }
  }

  console.log(`\n🎉 Successfully created ${createdCount} products!`);
};

// Main seed function
const seedDatabase = async () => {
  try {
    await connectDB();
    await clearProducts();
    await seedCategoriesAndBrands();
    await createProducts();

    console.log("\n✨ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
