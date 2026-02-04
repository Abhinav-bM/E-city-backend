// scripts/verify-variants.js
import mongoose from "mongoose";
import productServices from "../services/product-service.js"; // Adjust path if needed
import { BASE_PRODUCT, PRODUCT_VARIANT } from "../models/product-model.js";

// MOCK OR CONNECT DB - For this script, we need a real connection or mock.
// Assuming local mongo or we can try to use a memory server if installed, but let's try connecting to a test DB if we knew the URI.
// CONSTANT URI for dev:
const MONGO_URI = "mongodb://localhost:27017/ecity_test_variants";

const runTests = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for testing...");

    // CLEANUP
    await BASE_PRODUCT.deleteMany({});
    await PRODUCT_VARIANT.deleteMany({});
    console.log("Cleaned up old test data.");

    // TEST 1: Happy Path - Add New Product with Variants
    console.log("\n--- TEST 1: Add Standard Product (New) ---");
    const productData = {
      name: "iPhone 15",
      brand: "Apple",
      description: "Latest iPhone",
      category: "Mobile",
      variantAttributes: [
        { name: "Color", values: ["Black", "Blue"] },
        { name: "Storage", values: ["128GB", "256GB"] },
      ],
      variants: [
        {
          attributes: { Color: "Black", Storage: "128GB" },
          price: 999,
          stock: 10,
          sku: "IP15-BLK-128",
          images: [],
          condition: "New",
        },
        {
          attributes: { Color: "Blue", Storage: "256GB" },
          price: 1099,
          stock: 5,
          sku: "IP15-BLU-256",
          images: [],
          condition: "New",
        },
      ],
      images: [],
    };
    const result1 = await productServices.addProduct(productData);
    console.log("✅ Product added successfully:", result1.baseProduct.title);
    if (result1.variants.length !== 2) throw new Error("Expected 2 variants");

    // TEST 2: Add Used/Refurbished with Condition & Metadata
    console.log("\n--- TEST 2: Add Refurbished & Unique Used Items ---");
    const refurbishedData = {
      name: "MacBook Pro M1",
      brand: "Apple",
      description: "Powerful laptop",
      category: "Laptop",
      variantAttributes: [
        { name: "RAM", values: ["16GB"] },
        { name: "SSD", values: ["512GB"] },
      ],
      variants: [
        {
          attributes: { RAM: "16GB", SSD: "512GB" },
          price: 1200,
          stock: 50, // Batch of refurbished items
          sku: "MBP-M1-REFURB-A",
          condition: "Refurbished",
          conditionDescription: "Grade A - Like New",
          warranty: "1 Year Seller Warranty",
          metadata: { refurbishedBy: "Apple", batteryCycle: "Under 50" },
        },
        {
          attributes: { RAM: "16GB", SSD: "512GB" },
          price: 900,
          stock: 1, // Unique Item 1
          sku: "MBP-M1-USED-001",
          condition: "Used",
          conditionDescription: "Scratch on lid",
          images: [{ url: "scratch_pic.jpg" }],
        },
        {
          attributes: { RAM: "16GB", SSD: "512GB" },
          price: 900,
          stock: 1, // Unique Item 2 (Same attributes, different defect)
          sku: "MBP-M1-USED-002",
          condition: "Used",
          conditionDescription: "Dent on corner", // DIFFERENT DESCRIPTION
          images: [{ url: "dent_pic.jpg" }],
        },
      ],
      images: [],
    };

    const result2 = await productServices.addProduct(refurbishedData);
    console.log(
      "✅ Refurbished/Used Product added:",
      result2.baseProduct.title,
    );
    console.log("   Variants created:", result2.variants.length);

    // Verify metadata retrieval
    const refurbVariant = result2.variants.find(
      (v) => v.condition === "Refurbished",
    );
    if (refurbVariant.metadata.get("refurbishedBy") !== "Apple")
      throw new Error("Metadata check failed");
    console.log("✅ Metadata Verified");

    // TEST 3: Validation Error (Missing Attribute)
    console.log("\n--- TEST 3: Validation Error (Missing Attribute) ---");
    try {
      await productServices.addProduct({
        name: "Fail Product",
        brand: "Test",
        description: "Test",
        category: "Test",
        variantAttributes: [{ name: "Size", values: ["S", "M"] }],
        variants: [
          {
            attributes: { Color: "Red" }, // INVALID: Missing Size, extra Color
            price: 10,
            stock: 10,
            sku: "FAIL-1",
          },
        ],
      });
      console.error("❌ Failed to catch missing attribute error");
    } catch (e) {
      console.log("✅ Caught expected error:", e.message);
    }

    // TEST 4: Duplicate Variant Error
    console.log("\n--- TEST 4: Duplicate Variant Error ---");
    try {
      await productServices.addProduct({
        name: "Dup Product",
        brand: "Test",
        description: "Test",
        category: "Test",
        variantAttributes: [{ name: "Size", values: ["S"] }],
        variants: [
          {
            attributes: { Size: "S" },
            condition: "New",
            price: 10,
            stock: 10,
            sku: "DUP-1",
          },
          {
            attributes: { Size: "S" },
            condition: "New", // EXACT DUPLICATE
            price: 10,
            stock: 10,
            sku: "DUP-2",
          },
        ],
      });
      console.error("❌ Failed to catch duplicate variant error");
    } catch (e) {
      console.log("✅ Caught expected duplicate error:", e.message);
    }
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDone.");
  }
};

runTests();
