import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./state/AppContext";
import AppRoutes from "./routes/AppRoutes";
<<<<<<< HEAD
import MotionRoot from "./components/Motion";
=======
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
<<<<<<< HEAD
        <MotionRoot />
=======
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
