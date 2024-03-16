import React from 'react';
import { useNavigate } from 'react-router-dom';

function LogoutButton({setIsLoggedIn}) {
    const navigate = useNavigate();

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        localStorage.removeItem('username'); 
        navigate('/');
    };

    return (
        <button type="button" className="btn btn-primary" onClick={handleLogout}>
            Logout
        </button>
    );
}

export default LogoutButton;
