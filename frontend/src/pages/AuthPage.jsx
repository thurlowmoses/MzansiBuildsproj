import { useEffect, useMemo, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/auth.css";

const PASSWORD_RULES = [
	{
		id: "length",
		label: "At least 12 characters",
		test: (password) => password.length >= 12,
	},
	{
		id: "upper",
		label: "At least one uppercase letter",
		test: (password) => /[A-Z]/.test(password),
	},
	{
		id: "lower",
		label: "At least one lowercase letter",
		test: (password) => /[a-z]/.test(password),
	},
	{
		id: "digit",
		label: "At least one number",
		test: (password) => /\d/.test(password),
	},
	{
		id: "special",
		label: "At least one special character",
		test: (password) => /[!@#$%^&*()[\]{}\-_=+|;:'",.<>/?`~]/.test(password),
	},
];

function getPasswordStatus(password) {
	const checks = PASSWORD_RULES.map((rule) => ({
		...rule,
		passed: rule.test(password),
	}));
	const passedCount = checks.filter((item) => item.passed).length;
	const score = Math.round((passedCount / checks.length) * 100);

	let label = "Weak";
	if (score >= 80) {
		label = "Strong";
	} else if (score >= 60) {
		label = "Good";
	} else if (score >= 40) {
		label = "Fair";
	}

	return {
		checks,
		score,
		label,
		isValid: checks.every((item) => item.passed),
	};
}

function normalizeComparisonValue(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

function getPasswordReuseStatus(password, email, displayName) {
	const normalizedPassword = normalizeComparisonValue(password);
	const emailLocalPart = normalizeComparisonValue(String(email || "").split("@")[0]);
	const displayNameValue = normalizeComparisonValue(displayName);

	const checks = [
		{
			id: "email-local-part",
			label: "Password is different from the email name part",
			passed: !emailLocalPart || normalizedPassword !== emailLocalPart,
		},
		{
			id: "display-name",
			label: "Password is different from your display name",
			passed:
				!displayNameValue ||
				!normalizedPassword ||
				!normalizedPassword.includes(displayNameValue) && !displayNameValue.includes(normalizedPassword),
		},
	];

	return {
		checks,
		isValid: checks.every((item) => item.passed),
	};
}

function AuthPage() {
	const navigate = useNavigate();
	const location = useLocation();
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
	const [showResend, setShowResend] = useState(false);
	const passwordStatus = useMemo(() => getPasswordStatus(formData.password), [formData.password]);
	const passwordReuseStatus = useMemo(
		() => getPasswordReuseStatus(formData.password, formData.email, formData.displayName),
		[formData.password, formData.email, formData.displayName]
	);
	const confirmPasswordMatches = formData.confirmPassword === formData.password;
	const authRouteState = location.state || {};

	useEffect(() => {
		if (authRouteState?.mode === "login") {
			setMode("login");
			setFormData((prev) => ({
				...prev,
				displayName: "",
				email: authRouteState.email || prev.email,
				password: "",
				confirmPassword: "",
			}));
			if (authRouteState.successMessage) {
				setSuccessMessage(authRouteState.successMessage);
			}
			if (authRouteState.clearPasswordHints) {
				setShowResend(false);
			}
		}
	}, [authRouteState]);

	const isRegisterFormValid =
		Boolean(formData.displayName.trim()) &&
		Boolean(formData.email.trim()) &&
		passwordStatus.isValid &&
		passwordReuseStatus.isValid &&
		confirmPasswordMatches;

	const clearMessages = () => {
		setErrorMessage("");
		setSuccessMessage("");
	};

	const handleAuthError = (error) => {
		setErrorMessage(error.message || "Something went wrong. Please try again.");
		if (error.message?.includes("verified") || error.message?.includes("verify")) {
			setShowResend(true);
		}
	};

	const validateRegisterForm = () => {
		if (!confirmPasswordMatches) {
			return "Passwords do not match.";
		}

		const firstFailed = passwordStatus.checks.find((item) => !item.passed);
		if (firstFailed) {
			return `Password rule not met: ${firstFailed.label}.`;
		}

		const reuseFailed = passwordReuseStatus.checks.find((item) => !item.passed);
		if (reuseFailed) {
			return `Password rule not met: ${reuseFailed.label}.`;
		}

		return "";
	};

	const handleRegisterSubmit = async () => {
		const validationError = validateRegisterForm();
		if (validationError) {
			throw new Error(validationError);
		}

		await register({
			displayName: formData.displayName,
			email: formData.email,
			password: formData.password,
		});

		await signOut(auth);

		navigate("/auth", {
			replace: true,
			state: {
				mode: "login",
				email: formData.email,
				successMessage:
					"Account created! Check your email at " +
					formData.email +
					" and click the verification link before logging in.",
				clearPasswordHints: true,
			},
		});
	};

	const handleLoginSubmit = async () => {
		const user = await login({
			email: formData.email,
			password: formData.password,
		});

		if (!user.emailVerified) {
			await signOut(auth);
			setShowResend(true);
			throw new Error(
				"Email not verified. Please check your inbox and click the verification link."
			);
		}

		setSuccessMessage("Welcome back! Redirecting...");
		setTimeout(() => navigate("/feed"), 800);
	};

	const onChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errorMessage) {
			setErrorMessage("");
		}
	};

	const onSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		clearMessages();
		setShowResend(false);

		try {
			if (mode === "register") {
				await handleRegisterSubmit();
			} else {
				await handleLoginSubmit();
			}
		} catch (error) {
			handleAuthError(error);
		} finally {
			setLoading(false);
		}
	};

	const resendVerification = async () => {
		try {
			clearMessages();
			const { signInWithEmailAndPassword, sendEmailVerification } = await import(
				"firebase/auth"
			);
			const userCredential = await signInWithEmailAndPassword(
				auth,
				formData.email,
				formData.password
			);
			await sendEmailVerification(userCredential.user);
			await signOut(auth);
			setSuccessMessage("Verification email resent. Check your inbox.");
		} catch {
			setErrorMessage("Could not resend. Make sure your email and password are correct.");
		}
	};

	const onForgotPassword = async () => {
		// Trigger Firebase reset email from the login form.
		try {
			clearMessages();

			if (!formData.email.trim()) {
				throw new Error("Enter your email address first, then click Forgot password.");
			}

			await sendPasswordResetEmail(auth, formData.email.trim());
			setSuccessMessage("Password reset email sent. Check your inbox.");
		} catch (error) {
			setErrorMessage(error.message || "Could not send password reset email.");
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
							minLength={12}
						/>
						{mode === "register" && (
							<>
								<p className="password-hint">
									Password strength: {passwordStatus.label} ({passwordStatus.score}%)
								</p>
								<ul className="password-checklist">
									{passwordStatus.checks.map((item) => (
										<li key={item.id} className={item.passed ? "passed" : "pending"}>
											{item.label}
										</li>
									))}
									{passwordReuseStatus.checks.map((item) => (
										<li key={item.id} className={item.passed ? "passed" : "pending"}>
											{item.label}
										</li>
									))}
								</ul>
							</>
						)}
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
								minLength={12}
							/>
							{formData.confirmPassword ? (
								<p className={confirmPasswordMatches ? "password-match pass" : "password-match fail"}>
									{confirmPasswordMatches ? "Passwords match." : "Passwords do not match yet."}
								</p>
							) : null}
						</div>
					)}

					{mode === "login" && (
						<button type="button" className="forgot-password-btn" onClick={onForgotPassword}>
							Forgot password?
						</button>
					)}

					{/* Submit action changes by mode. */}
					<button
						className="auth-button"
						type="submit"
						disabled={loading || (mode === "register" && !isRegisterFormValid)}
					>
						{loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
					</button>
				</form>

				{errorMessage && <p className="error-message">{errorMessage}</p>}
				{showResend && (
					<p style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
						Did not receive the email?{" "}
						<button
							type="button"
							onClick={resendVerification}
							style={{
								background: "none",
								border: "none",
								color: "#4caf50",
								cursor: "pointer",
								textDecoration: "underline",
							}}
						>
							Resend verification email
						</button>
					</p>
				)}
				{successMessage && <p className="success-message">{successMessage}</p>}

				<p className="auth-toggle">
					{mode === "login" ? "No account yet?" : "Already registered?"}{" "}
					<button
						type="button"
						onClick={() => {
							setMode(mode === "login" ? "register" : "login");
							setErrorMessage("");
							setSuccessMessage("");
							setShowResend(false);
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
