import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DefaultRoute = () => {
    const { userRole, loading } = useAuth();

    if (loading) return null;

    // Default for all roles since everyone has a dashboard now
    return <Navigate to="/dashboard" replace />;
};

export default DefaultRoute;
