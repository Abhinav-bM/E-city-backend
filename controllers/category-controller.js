import { Category } from "../models/category-model.js";
import { sendResponse, sendError } from "../utils/response-handler.js";
import { asyncHandler } from "../utils/async-handler.js";

// Helper to build recursive tree
const buildCategoryTree = (categories, parentId = null) => {
  const categoryList = [];
  let category;
  if (!categories || categories.length === 0) return [];

  if (parentId == null) {
    category = categories.filter(
      (cat) => cat.parentId == undefined || cat.parentId == null,
    );
  } else {
    category = categories.filter(
      (cat) => String(cat.parentId) == String(parentId),
    );
  }

  for (let cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      slug: cate.slug,
      parentId: cate.parentId,
      image: cate.image,
      description: cate.description,
      isActive: cate.isActive,
      children: buildCategoryTree(categories, cate._id),
    });
  }
  return categoryList;
};

// Create Category
const createCategory = asyncHandler(async (req, res) => {
  const { name, parentId, image, description } = req.body;

  if (!name) {
    return sendError(res, 400, "Name is required");
  }

  // Generate slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const categoryObj = {
    name,
    slug,
    image,
    description,
  };

  if (parentId) {
    categoryObj.parentId = parentId;
  }

  const category = await new Category(categoryObj).save();

  return sendResponse(
    res,
    201,
    true,
    "Category created successfully",
    category,
  );
});

// Get Categories (Tree Structure)
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});

  if (!categories) {
    return sendResponse(res, 200, true, "No categories found", []);
  }

  const categoryTree = buildCategoryTree(categories);

  return sendResponse(
    res,
    200,
    true,
    "Categories fetched successfully",
    categoryTree,
  );
});

// Update Category
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, parentId, image, description } = req.body;

  const existingCategory = await Category.findById(id);
  if (!existingCategory) {
    return sendError(res, 404, "Category not found");
  }

  // If name changed, update slug
  if (name && name !== existingCategory.name) {
    existingCategory.name = name;
    existingCategory.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  if (parentId !== undefined) existingCategory.parentId = parentId || null; // Allow setting to root
  if (image) existingCategory.image = image;
  if (description) existingCategory.description = description;

  const updatedCategory = await existingCategory.save();

  return sendResponse(
    res,
    200,
    true,
    "Category updated successfully",
    updatedCategory,
  );
});

// Toggle Category Status (Soft Delete/Enable)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    return sendError(res, 404, "Category not found");
  }

  // Toggle status
  const newStatus = !category.isActive;
  category.isActive = newStatus;
  await category.save();

  // Optional: Also toggle children?
  // For now, let's keep it simple. If a parent is disabled, children might still be active in DB but should be handled by frontend logic.
  // Or we could recursively disable children.
  // User asked to just "disable it".

  return sendResponse(
    res,
    200,
    true,
    `Category ${newStatus ? "activated" : "deactivated"} successfully`,
    { isActive: newStatus },
  );
});

export { createCategory, getCategories, updateCategory, deleteCategory };
