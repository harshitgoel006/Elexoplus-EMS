// import client from "../../../api/client";

// const login = async ({ email, password }) => {
//   try {
//     const { data } = await client.post("/auth/login", { email, password });

//     return {
//       success: true,
//       message: data.message || "Login successful.",
//       user: data.user,
//       token: data.token,
//       refreshToken: data.refresh_token,
//     };
//   } catch (error) {
//     const message =
//       error.response?.data?.message || "Unable to connect. Please try again.";

//     return {
//       success: false,
//       message,
//       user: null,
//       token: null,
//       refreshToken: null,
//     };
//   }
// };

// const getCurrentUser = async () => {
//   const { data } = await client.get("/auth/me");

//   return data.success ? data.user : null;
// };

// const logout = async () => {
//   try {
//     await client.post("/auth/logout");
//   } catch {
//     // Server errors shouldn't block local logout.
//   }
// };

// const forgotPassword = async ({ email }) => {
//   try {
//     const { data } = await client.post("/auth/forgot-password", { email });

//     return {
//       success: true,
//       message: data.message || "Reset link sent.",
//       resetToken: data.reset_token,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.message || "Unable to send reset link.",
//       resetToken: null,
//     };
//   }
// };

// const resetPassword = async ({ token, password }) => {
//   try {
//     const { data } = await client.post("/auth/reset-password", { token, password });

//     return {
//       success: true,
//       message: data.message || "Password reset successfully.",
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.response?.data?.message || "Unable to reset password.",
//     };
//   }
// };

// const authService = {
//   login,
//   getCurrentUser,
//   logout,
//   forgotPassword,
//   resetPassword,
// };

// export default authService;













import client from "../../../api/client";
import MOCK_USERS from "../mock/mockUsers";

// Keep this false in normal environments. Set it to true only for isolated UI demos.
const USE_MOCK_AUTH = true;

const login = async ({ email, password }) => {
  // ==============================
  // TEMPORARY MOCK AUTH
  // ==============================
  if (USE_MOCK_AUTH) {
    const user = MOCK_USERS.find(
      (mockUser) =>
        mockUser.email.toLowerCase() === email.trim().toLowerCase() &&
        mockUser.password === password
    );

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password.",
        user: null,
        token: null,
        refreshToken: null,
      };
    }

    return {
      success: true,
      message: "Login successful.",
      user,
      token: `mock-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
    };
  }

  // ==============================
  // REAL BACKEND AUTH
  // Enable USE_MOCK_AUTH = false
  // when backend authentication is ready.
  // ==============================

  try {
    const { data } = await client.post("/auth/login", { email, password });

    return {
      success: true,
      message: data.message || "Login successful.",
      user: data.user,
      token: data.token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    const message =
      error.response?.data?.message || "Unable to connect. Please try again.";

    return {
      success: false,
      message,
      user: null,
      token: null,
      refreshToken: null,
    };
  }
};

const getCurrentUser = async () => {
  if (USE_MOCK_AUTH) return null;

  const { data } = await client.get("/auth/me");

  return data.success ? data.user : null;
};

const logout = async () => {
  if (USE_MOCK_AUTH) return;

  try {
    await client.post("/auth/logout");
  } catch {
    // Server errors shouldn't block local logout.
  }
};

const forgotPassword = async ({ email }) => {
  if (USE_MOCK_AUTH) {
    const user = MOCK_USERS.find(
      (mockUser) =>
        mockUser.email.toLowerCase() === email.trim().toLowerCase()
    );

    return {
      success: Boolean(user),
      message: user
        ? "Reset link sent."
        : "No account found with this email.",
      resetToken: user ? `mock-reset-token-${user.id}` : null,
    };
  }

  try {
    const { data } = await client.post("/auth/forgot-password", { email });

    return {
      success: true,
      message: data.message || "Reset link sent.",
      resetToken: data.reset_token,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Unable to send reset link.",
      resetToken: null,
    };
  }
};

const resetPassword = async ({ token, password }) => {
  if (USE_MOCK_AUTH) {
    return {
      success: true,
      message: "Password reset successfully.",
    };
  }

  try {
    const { data } = await client.post("/auth/reset-password", {
      token,
      password,
    });

    return {
      success: true,
      message: data.message || "Password reset successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Unable to reset password.",
    };
  }
};

const authService = {
  login,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
};

export default authService;
