import wishlistServices from "../services/wishlist-service.js";

// Add product to wishlist
const addToWishlist = async (req, res) => {
  // console.log("PRODUCT ID  : ", req.body.product_id)
  // try {
  //   const userId = "67e409c7c3aa0fe93489adc5";
  //   const productId = req.body.product_id;

  //   const wishlist = await wishlistServices.addToWishlist(userId, productId);

  //   const apiResponse = new ApiResponse();
  //   apiResponse.message = "Products add to wishlist successfully";
  //   apiResponse.data = wishlist;
  //   apiResponse.statusCode = 200;

  //   res.json(apiResponse);
  // } catch (error) {
  //   console.error("Error while adding product to wishlist: ", error);

  //   const apiResponse = new ApiResponse();
  //   apiResponse.message = "Error while adding product to wishlist";
  //   apiResponse.error = error.message;
  //   apiResponse.statusCode = 500;

  //   return res.status(500).json(apiResponse);
  // }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  // try {
  //   console.log("PRODUCT ID : ");

  //   const userId = "67e409c7c3aa0fe93489adc5";
  //   const productId = req.body.product_id;

  //   console.log("PRODUCT ID : ", productId);

  //   const wishlist = await wishlistServices.removeFromWishlist(
  //     userId,
  //     productId
  //   );

  //   const apiResponse = new ApiResponse();
  //   apiResponse.message = "Products removed from wishlist successfully";
  //   apiResponse.data = wishlist;
  //   apiResponse.statusCode = 200;

  //   res.json(apiResponse);
  // } catch (error) {
  //   console.error("Error while removing product from wishlist : ", error);

  //   const apiResponse = new ApiResponse();
  //   apiResponse.message = "Error while removing product from wishlist";
  //   apiResponse.error = error.message;
  //   apiResponse.statusCode = 500;

  //   return res.status(500).json(apiResponse);
  // }
};

export { addToWishlist, removeFromWishlist };
