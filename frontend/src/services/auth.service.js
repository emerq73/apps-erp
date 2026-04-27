import axios from 'axios';

const API_URL = '/api';

// Configuración de Axios
const api = axios.create({
    baseURL: API_URL,
});

// Interceptor para agregar Token a cada petición
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const companyId = localStorage.getItem('activeCompanyId');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (companyId) {
        config.headers['x-company-id'] = companyId;
    }
    return config;
});

// Interceptor para manejar expiración de sesión (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginPath = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/verify-2fa');
        
        if (error.response?.status === 401 && !isLoginPath) {
            logout();
            window.location.href = '/login?expired=true';
        }
        return Promise.reject(error);
    }
);

export const login = async (email, password, rememberMe = false) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.access_token) {
            // Si el usuario marcó "Recordarme", podríamos usar una cookie de larga duración en el futuro
            // Por ahora, manejamos la persistencia estándar
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error) {
        console.error('[AuthService] Login Error:', error);
        throw error.response?.data?.message || error.message || 'Error al iniciar sesión';
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const verify2FA = async (userId, code) => {
    try {
        const response = await api.post('/auth/verify-2fa', { userId, code });
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Código 2FA inválido';
    }
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export const generate2FA = () => api.post('/auth/generate-2fa');
export const enable2FA = (code) => api.post('/auth/enable-2fa', { code });

export default api;
