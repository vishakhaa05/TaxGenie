import AppRoutes from "./routes";
import { ThemeProvider } from "./context/theme-provider";
import { AuthProvider } from "./auth/AuthContext";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;