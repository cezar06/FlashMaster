import React from 'react';
import { useNavigate } from 'react-router-dom';

function RegistrationButton() {
    const navigate = useNavigate();

    const handleRegistration = () => {
        navigate('/register');
    };

    return (
        <button type="button" className="btn btn-primary" onClick={handleRegistration}>
            Register
        </button>
    );
}

export default RegistrationButton;
