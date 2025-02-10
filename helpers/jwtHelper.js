// const jwt = require("jsonwebtoken");

// const signAccessToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_ACCESS_KEY, {
//     expiresIn: process.env.JWT_ACCESS_EXPIRY,
//   });
// };

// const signRefreshToken = (payload) => {
//   return jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
//     expiresIn: process.env.JWT_REFRESH_EXPIRY,
//   });
// };

// const verifyAccessToken = (token) => {
//   return jwt.verify(token, process.env.JWT_ACCESS_KEY);
// };

// const verifyRefreshToken = (token) => {
//   return jwt.verify(token, process.env.JWT_REFRESH_KEY);
// };

// module.exports = {
//   signAccessToken,
//   signRefreshToken,
//   verifyAccessToken,
//   verifyRefreshToken,
// };
