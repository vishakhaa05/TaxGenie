import { useEffect } from "react";
import { useAppDispatch, useTypedSelector } from "@/app/hook";
import { logout, updateCredentials } from "@/features/auth/authSlice";
import { useRefreshMutation } from "@/features/auth/authAPI";

const useAuthExpiration = () => {
  const {
    accessToken,
    refreshToken: currentRefreshToken,
    expiresAt,
  } = useTypedSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [refreshToken] = useRefreshMutation();

  useEffect(() => {
    const handleLogout = () => {
      console.log("Token expired, logging out...");
      dispatch(logout());
    };

    const handleTokenRefresh = async () => {
      try {
        const res = await refreshToken({
          refreshToken: currentRefreshToken,
        }).unwrap();
        dispatch(
          updateCredentials({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            expiresAt: res.expiresAt,
            user: res.user,
          })
        );
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Token refresh failed, logging out...", error);
        handleLogout();
      }
    };

    if (accessToken && expiresAt) {
      const currentTime = Date.now();
      const timeUntilExpiration = expiresAt - currentTime;
      if (timeUntilExpiration <= 0) {
        // Token is already expired
        handleTokenRefresh();
      } else {
        // Max 32-bit signed integer delay for setTimeout is ~24.8 days (2147483647 ms).
        // Larger values overflow in JavaScript and fire immediately (1ms), causing unintended logouts.
        const MAX_TIMEOUT_MS = 2147483647;
        const delay = Math.min(timeUntilExpiration, MAX_TIMEOUT_MS);
        const timer = setTimeout(() => {
          if (timeUntilExpiration <= MAX_TIMEOUT_MS) {
            handleLogout();
          }
        }, delay);
        // Cleanup the timer on component unmount or token change
        return () => clearTimeout(timer);
      }
    }
  }, [accessToken, dispatch, expiresAt, refreshToken]);
};

export default useAuthExpiration;