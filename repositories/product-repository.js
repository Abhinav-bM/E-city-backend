import mongoose from "mongoose";
import PRODUCT from "../models/product-model.js";

const createProduct = async (productObj) => {
  const product = await new PRODUCT(productObj).save();
  return product;
};

const getAllProducts = async () => {
  const products = await PRODUCT.aggregate([
    {
      $addFields: {
        baseVariantPrice: { $min: "$variant.price" },
      },
    },
    {
      $project: {
        name: 1,
        status: 1,
        baseVariant: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$variant",
                as: "v",
                cond: { $eq: ["$$v.price", "$baseVariantPrice"] },
              },
            },
            0,
          ],
        },
      },
    },
  ]);

  return products;
};

const getProduct = async (product_id) => {
  const product = await PRODUCT.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(product_id) },
    },
    {
      $addFields: {
        baseVariantPrice: { $min: "$variant.price" },
      },
    },
    {
      $project: {
        name: 1,
        status: 1,
        baseVariant: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$variant",
                as: "v",
                cond: { $eq: ["$$v.price", "$baseVariantPrice"] },
              },
            },
            0,
          ],
        },
      },
    },
  ]);

  return product;
};

export default {
  createProduct,
  getAllProducts,
  getProduct,
};
