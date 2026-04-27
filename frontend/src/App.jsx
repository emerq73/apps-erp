import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import CompanySelection from './pages/CompanySelection';

const Dashboard = lazy(() => import('./pages/Dashboard'));

const Loading = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem('token'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const isSessionReady = !!(localStorage.getItem('activeCompanyId') && localStorage.getItem('activePeriodId'));

    const getHomeRedirect = () => {
        if (!isAuthenticated) return "/login";
        if (!isSessionReady) return "/select-session";
        return "/dashboard";
    };

    return (
        <Router>
            <Routes>
                <Route 
                    path="/login" 
                    element={isAuthenticated ? <Navigate to={isSessionReady ? "/dashboard" : "/select-session"} /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />} 
                />
                <Route 
                    path="/select-session" 
                    element={isAuthenticated ? (isSessionReady ? <Navigate to="/dashboard" /> : <CompanySelection onSelectionComplete={() => window.location.reload()} onLogout={() => { localStorage.clear(); setIsAuthenticated(false); }} />) : <Navigate to="/login" />} 
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                    path="/dashboard/*"
                    element={isAuthenticated ? (isSessionReady ? <Suspense fallback={<Loading />}><Dashboard onLogout={() => setIsAuthenticated(false)} /></Suspense> : <Navigate to="/select-session" />) : <Navigate to="/login" />}
                />
                <Route path="/" element={<Navigate to={getHomeRedirect()} />} />
                <Route path="*" element={<Navigate to={getHomeRedirect()} />} />
            </Routes>
        </Router>
    );
}

export default App;
