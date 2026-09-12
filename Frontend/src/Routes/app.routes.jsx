import { Routes, Route } from "react-router-dom";
import Login from "../features/auth/pages/Login.jsx";
import Register from "../features/auth/pages/Register.jsx";
import Dashboard from '../features/chat/pages/Dashboard.jsx';
import Protected from '../features/auth/components/Protected.jsx';
function AuthRoutes() {
  return (
    <Routes>
                 <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
    </Routes>
  
    
  );
}
export default AuthRoutes


