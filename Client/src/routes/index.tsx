import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  authenticationRoutePaths,
  publicAppRoutePaths,
  protectedRoutePaths,
} from "./common/routes";
import AppLayout from "@/layouts/app-layout";
import BaseLayout from "@/layouts/base-layout";
import AuthRoute from "./authRoute";
import ProtectedRoute from "./protectedRoute";
import useAuthExpiration from "@/hooks/use-auth-expiration";
import RouteLoader from "@/components/ui/route-loader";

const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));

function AppRoutes() {
  useAuthExpiration();
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone Full-Page Landing Page matching Mockup */}
        <Route
          path="/landing"
          element={
            <Suspense fallback={<RouteLoader />}>
              <LandingPage />
            </Suspense>
          }
        />

        {/* Authentication routes (Login, Signup) */}
        <Route element={<AuthRoute />}>
          <Route element={<BaseLayout />}>
            {authenticationRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Main Application Shell (Accessible to both Guests and Users) */}
        <Route element={<AppLayout />}>
          {/* Public routes (Calculators, Dashboard Overview, etc.) */}
          {publicAppRoutePaths.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}

          {/* Protected routes (Settings, Saved Items, Transactions, Admin) */}
          <Route element={<ProtectedRoute />}>
            {protectedRoutePaths.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              >
                {(route as any).children?.map((childRoute: any) => (
                  <Route
                    key={childRoute.path || "index"}
                    index={childRoute.index}
                    path={childRoute.path}
                    element={childRoute.element}
                  />
                ))}
              </Route>
            ))}
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
