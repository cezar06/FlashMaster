const RegistrationPage = () => {
    const handleSubmit = async (event) => {
        event.preventDefault();
        const {username, email, password} = event.target.elements;
        const requestBody = {
            username: username.value,
            email: email.value,
            password: password.value
        }
        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody)
        }
        try {
            const response = await fetch("http://localhost:5000/register", requestOptions);
            console.log(response);
            if (response.ok) {
                alert('Registration successful');
            } else if (response.status === 400) {
                alert('Username or email already exists');
            }
        } catch (error) {
            console.error(error);
            alert('Registration failed');
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input type="text" className="form-control" id="username" name="username" required/>
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input type="email" className="form-control" id="email" name="email" required/>
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" className="form-control" id="password" name="password" required/>
                </div>
                <button type="submit" className="btn btn-primary">Register</button>
            </form>
        </div>
    );
};

export default RegistrationPage;
