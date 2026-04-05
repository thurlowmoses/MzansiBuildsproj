import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/auth.css";

function AuthPage() {
	const navigate = useNavigate();
	const { login, register } = useAuth();

	const [mode, setMode] = useState("login");
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		displayName: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const onChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setErrorMessage("");
		setSuccessMessage("");

		try {
			if (mode === "register") {
				if (formData.password !== formData.confirmPassword) {
					throw new Error("Passwords do not match.");
				}

				await register({
					displayName: formData.displayName,
					email: formData.email,
					password: formData.password,
				});

				setSuccessMessage("Account created. Verification email sent to your inbox.");
			} else {
				await login({
					email: formData.email,
					password: formData.password,
				});

				setSuccessMessage("Login successful. Redirecting to your feed...");
				navigate("/feed");
			}
		} catch (error) {
			setErrorMessage(error.message || "Authentication failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main>
			<section className="auth-container">
				<h1 className="auth-title">{mode === "login" ? "Login" : "Create Account"}</h1>

				<form className="auth-form" onSubmit={onSubmit}>
					{mode === "register" && (
						<div className="form-group">
							<label htmlFor="displayName">Full Name</label>
							<input
								id="displayName"
								name="displayName"
								type="text"
								value={formData.displayName}
								onChange={onChange}
								required
							/>
						</div>
					)}

					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							value={formData.email}
							onChange={onChange}
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							value={formData.password}
							onChange={onChange}
							required
							minLength={6}
						/>
					</div>

					{mode === "register" && (
						<div className="form-group">
							<label htmlFor="confirmPassword">Confirm Password</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								value={formData.confirmPassword}
								onChange={onChange}
								required
								minLength={6}
							/>
						</div>
					)}

					<button className="auth-button" type="submit" disabled={loading}>
						{loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
					</button>
				</form>

				{errorMessage && <p className="error-message">{errorMessage}</p>}
				{successMessage && <p className="success-message">{successMessage}</p>}

				<p className="auth-toggle">
					{mode === "login" ? "No account yet?" : "Already registered?"}{" "}
					<button
						type="button"
						onClick={() => {
							setMode(mode === "login" ? "register" : "login");
							setErrorMessage("");
							setSuccessMessage("");
						}}
					>
						{mode === "login" ? "Create one" : "Login"}
					</button>
				</p>
			</section>
		</main>
	);
}

export default AuthPage;
