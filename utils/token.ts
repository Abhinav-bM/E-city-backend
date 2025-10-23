import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export const createAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

export const createRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
