import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = ({setIsLoggedIn}) => {
    const navigate = useNavigate();
    const handleSubmit = async (event) => {
        event.preventDefault();
        const { username, password } = event.target.elements;
        const requestBody = {
            username: username.value,
            password: password.value,
        };
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        };
        try {
            const response = await fetch(
                "http://localhost:5000/login",
                requestOptions
            )
            ;
            console.log(response);
            if (response.ok) {
                const token = getCookie("token");
                console.log(token);
                localStorage.setItem("token", token);
                localStorage.setItem("username", username.value); 
                setIsLoggedIn(true);
                navigate("/");
            } else if (response.status === 401) {
                alert("Incorrect username or password");
            }
            
        } catch (error) {
            console.error(error);
            alert("Login failed");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                        Username
                    </label>
                    <input type="text" className="form-control" id="username" name="username" required />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        Password
                    </label>
                    <input type="password" className="form-control" id="password" name="password" required />
                </div>
                <button type="submit" className="btn btn-primary">
                    Login
                </button>
            </form>
        </div>
    );
};

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}
export default LoginPage;