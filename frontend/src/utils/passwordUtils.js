// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

export const PASSWORD_RULES = [
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

// Handles getPasswordStatus.
export function getPasswordStatus(password) {
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

// Handles normalizeComparisonValue.
function normalizeComparisonValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Handles getPasswordReuseStatus.
export function getPasswordReuseStatus(password, email, displayName) {
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
        (!normalizedPassword.includes(displayNameValue) &&
          !displayNameValue.includes(normalizedPassword)),
    },
  ];

  return {
    checks,
    isValid: checks.every((item) => item.passed),
  };
}

