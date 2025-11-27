import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function SocialCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');

        const handleLogin = async () => {
            if (token) {
                // 1. Store the token immediately
                localStorage.setItem("authToken", token);

                try {
                    // 2. Re-initialize axiosClient to use the new token for the next request
                    // This is important because the default instance might not have the token yet
                    const response = await axiosClient.get('/me', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    
                    const { role, user } = response.data;

                    // 3. Store user info
                    localStorage.setItem("userRole", role);
                    localStorage.setItem("userInfo", JSON.stringify(user));

                    // 4. Redirect based on role
                    if (role === 'admin' || role === 'Admin') {
                        navigate("/admin/dashboard");
                    } else {
                        navigate("/");
                    }

                } catch (error) {
                    console.error("Failed to fetch user data after social login:", error);
                    // If fetching user fails, clear token and redirect to login
                    localStorage.removeItem("authToken");
                    navigate("/login?error=social_login_failed");
                }
            } else {
                // No token found, redirect to login
                navigate("/login?error=token_missing");
            }
        };

        handleLogin();
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-700">
                    Finalizing authentication...
                </h1>
                <div className="mt-4 w-16 h-16 border-8 border-dashed rounded-full animate-spin border-blue-600 mx-auto"></div>
            </div>
        </div>
    );
}
