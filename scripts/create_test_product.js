import fetch from "node-fetch";

const productData = {
  name: "Samsung Galaxy S24 Ultra (Titanium) - Test Specs",
  brand: "Samsung",
  description:
    "The ultimate Galaxy with AI. Experience the new era of mobile AI with the Galaxy S24 Ultra. Titanium frame, Gorilla Glass Armor, and the best camera yet.",
  category: "698c4ce95f9911b0e50d54d0", // Mobile category ID from previous logs
  variantAttributes: [
    { name: "Color", values: ["Titanium Gray", "Titanium Black"] },
    { name: "Storage", values: ["256GB", "512GB"] },
  ],
  specifications: [
    {
      group: "Performance",
      items: [
        { key: "Processor", value: "Snapdragon 8 Gen 3 for Galaxy" },
        { key: "RAM", value: "12GB LPDDR5X" },
        { key: "Storage", value: "256GB / 512GB / 1TB UFS 4.0" },
      ],
    },
    {
      group: "Display",
      items: [
        { key: "Size", value: "6.8-inch QHD+ Dynamic AMOLED 2X" },
        { key: "Resolution", value: "3120 x 1440 pixels" },
        { key: "Refresh Rate", value: "120Hz Adaptive" },
        { key: "Brightness", value: "2600 nits peak" },
      ],
    },
    {
      group: "Camera",
      items: [
        { key: "Main", value: "200MP Wide (f/1.7)" },
        { key: "Ultrawide", value: "12MP (f/2.2)" },
        { key: "Telephoto 1", value: "10MP 3x Optical Zoom" },
        { key: "Telephoto 2", value: "50MP 5x Optical Zoom" },
        { key: "Front", value: "12MP (f/2.2)" },
      ],
    },
    {
      group: "Battery & Charging",
      items: [
        { key: "Capacity", value: "5000mAh" },
        { key: "Wired Charging", value: "45W Super Fast Charging" },
        { key: "Wireless", value: "15W Fast Wireless Charging 2.0" },
      ],
    },
    {
      group: "Build & Connectivity",
      items: [
        { key: "Material", value: "Titanium Frame" },
        { key: "Water Resistance", value: "IP68" },
        { key: "S Pen", value: "Integrated S Pen" },
        { key: "OS", value: "Android 14 with One UI 6.1" },
      ],
    },
  ],
  images: [
    {
      url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800",
    },
    {
      url: "https://images.unsplash.com/photo-1610945265064-f6d214f762f4?w=800",
    },
  ],
  variants: [
    {
      attributes: { Color: "Titanium Gray", Storage: "256GB" },
      sellingPrice: 129999,
      actualPrice: 134999,
      stock: 50,
      sku: "S24U-TIT-GRAY-256",
      condition: "New",
      images: [
        {
          url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800",
        },
      ],
      isDefault: true,
    },
    {
      attributes: { Color: "Titanium Black", Storage: "512GB" },
      sellingPrice: 139999,
      actualPrice: 144999,
      stock: 20,
      sku: "S24U-TIT-BLK-512",
      condition: "New",
      images: [
        {
          url: "https://images.unsplash.com/photo-1610945265064-f6d214f762f4?w=800",
        },
      ],
      isDefault: false,
    },
  ],
};

fetch("http://localhost:5000/api/product", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(productData),
})
  .then((res) => res.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error(err));
