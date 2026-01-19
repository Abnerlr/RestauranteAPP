export interface JwtPayload {
  userId: string;
  role: string;
  restaurantId: string;
}

export interface CurrentUser {
  userId: string;
  role: string;
  restaurantId: string;
}
