// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const AuthMessages = ({ errorMessage, successMessage, showResend, onResendVerification }) => {
  return (
    <>
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
      {showResend ? (
        <p className="auth-resend-note">
          Did not receive the email?{" "}
          <button type="button" onClick={onResendVerification} className="auth-resend-btn">
            Resend verification email
          </button>
        </p>
      ) : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}
    </>
  );
};

export default AuthMessages;

