import {
  registerAccount,
  authenticateAccount,
  getAccount,
} from "../services/authService.js";
import { publicUser, createToken } from "../utils/token.js";
import { apiResponse } from "../utils/ApiResponse.js";

export async function register(req, res) {
  const user = await registerAccount(req.body);
  res.cookie("token", createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 86400000,
  });
  res.status(201).json(apiResponse("Account created", publicUser(user)));
}
export async function login(req, res) {
  const user = await authenticateAccount(req.body);
  res.cookie("token", createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 86400000,
  });
  res.json(apiResponse("Welcome back", publicUser(user)));
}
export async function me(req, res) {
  const user = await getAccount(req.user.id);
  res.json(apiResponse("Current account", user ? publicUser(user) : null));
}
export function logout(req, res) {
  res.clearCookie("token");
  res.json(apiResponse("Signed out", null));
}
