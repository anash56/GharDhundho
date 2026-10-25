import {
  registerAccount,
  authenticateAccount,
  getAccount,
} from "../services/authService.js";
import { publicUser, createToken, TOKEN_TTL_SECONDS } from "../utils/token.js";
import { apiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { env } from "../config/env.js";

const COOKIE_MAX_AGE = TOKEN_TTL_SECONDS * 1000;

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
  };
}

function setAuthCookie(res, user) {
  res.cookie("token", createToken(user), {
    ...authCookieOptions(),
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function register(req, res) {
  const user = await registerAccount(req.body);
  setAuthCookie(res, user);
  res.status(201).json(apiResponse("Account created", publicUser(user)));
}

export async function login(req, res) {
  const user = await authenticateAccount(req.body);
  setAuthCookie(res, user);
  res.json(apiResponse("Welcome back", publicUser(user)));
}

export async function me(req, res) {
  const user = await getAccount(req.user.id);
  if (!user) {
    throw new ApiError(401, "Your account no longer exists. Please sign in again.");
  }
  res.json(apiResponse("Current account", publicUser(user)));
}

export function logout(req, res) {
  // These cookie attributes, especially path, match the cookie used at login.
  res.clearCookie("token", authCookieOptions());
  res.json(apiResponse("Signed out", null));
}
