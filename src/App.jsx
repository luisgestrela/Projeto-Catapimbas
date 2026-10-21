import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./state/AppContext";
import AppRoutes from "./routes/AppRoutes";
import MotionRoot from "./components/Motion";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <MotionRoot />
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
