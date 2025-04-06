import USER from "../models/user-model.js";
import CART from "../models/cart-model.js";
import PRODUCT from "../models/product-model.js";
import { ObjectId } from "mongodb";

const addToCart = async (user_id, product_variant_id) => {
  try {
    const isProductExist = await PRODUCT.findOne({
      "variants._id": new ObjectId(product_variant_id),
    });

    if (!isProductExist) {
      throw new Error("Product variant not found");
    }

    let userCart = await CART.findOne({ user: ObjectId(user_id) });

    if (userCart) {
      // Check if the variant already exists in the cart
      let itemIndex = userCart.items.findIndex(
        (item) => item.variant.toString() === product_variant_id
      );

      if (itemIndex > -1) {
        // If exists, increase quantity
        userCart.items[itemIndex].quantity += 1;
      } else {
        // Else, add new variant to cart
        userCart.items.push({
          product: ObjectId(isProductExist._id),
          quantity: 1,
          variant: ObjectId(product_variant_id),
        });
      }
      await userCart.save();
    } else {
      // If user has no cart, create one
      userCart = new CART({
        user: ObjectId(user_id),
        items: [
          {
            product: ObjectId(isProductExist._id),
            quantity: 1,
            variant: ObjectId(product_variant_id),
          },
        ],
      });
      await userCart.save();
    }

    return userCart;
  } catch (error) {
    console.error("Error in addToCart:", error);
    throw error;
  }
};

export default { addToCart };
