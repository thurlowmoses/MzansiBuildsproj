// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const AuthForm = ({
  mode,
  formData,
  onChange,
  onSubmit,
  loading,
  isRegisterFormValid,
  onForgotPassword,
  passwordStatus,
  passwordReuseStatus,
  confirmPasswordMatches,
}) => {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {mode === "register" ? (
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
      ) : null}

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
        {mode === "register" ? (
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
        ) : null}
      </div>

      {mode === "register" ? (
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
      ) : null}

      {mode === "login" ? (
        <button type="button" className="forgot-password-btn" onClick={onForgotPassword}>
          Forgot password?
        </button>
      ) : null}

      <button className="auth-button" type="submit" disabled={loading || (mode === "register" && !isRegisterFormValid)}>
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
      </button>
    </form>
  );
};

export default AuthForm;

