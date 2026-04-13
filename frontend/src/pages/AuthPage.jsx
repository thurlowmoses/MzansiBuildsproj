// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import { useEffect, useMemo, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import AuthForm from "../components/auth/AuthForm";
import AuthMessages from "../components/auth/AuthMessages";
import { auth } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import { getPasswordReuseStatus, getPasswordStatus } from "../utils/passwordUtils";
import "../styles/auth.css";

// Handles AuthPage.
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

	// Handles clearMessages.
	const clearMessages = () => {
		setErrorMessage("");
		setSuccessMessage("");
	};

	// Handles handleAuthError.
	const handleAuthError = (error) => {
		setErrorMessage(error.message || "Something went wrong. Please try again.");
		if (error.message?.includes("verified") || error.message?.includes("verify")) {
			setShowResend(true);
		}
	};

	// Handles validateRegisterForm.
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

	// Handles handleRegisterSubmit.
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

	// Handles handleLoginSubmit.
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

	// Handles onChange.
	const onChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errorMessage) {
			setErrorMessage("");
		}
	};

	// Handles onSubmit.
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

	// Handles resendVerification.
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

	// Handles onForgotPassword.
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

				<AuthForm
					mode={mode}
					formData={formData}
					onChange={onChange}
					onSubmit={onSubmit}
					loading={loading}
					isRegisterFormValid={isRegisterFormValid}
					onForgotPassword={onForgotPassword}
					passwordStatus={passwordStatus}
					passwordReuseStatus={passwordReuseStatus}
					confirmPasswordMatches={confirmPasswordMatches}
				/>

				<AuthMessages
					errorMessage={errorMessage}
					successMessage={successMessage}
					showResend={showResend}
					onResendVerification={resendVerification}
				/>

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

