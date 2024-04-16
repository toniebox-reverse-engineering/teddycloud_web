import {useAuth} from "../../provider/AuthProvider";
import {Navigate, Outlet} from "react-router-dom";

export const PrivateRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}