import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginButton() {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <button type="button" className="btn btn-primary" onClick={handleLogin}>
            Login
        </button>
    );
}

export default LoginButton;