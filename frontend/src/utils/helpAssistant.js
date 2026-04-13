// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const HELP_INTENTS = [
  {
    id: "create-project",
    keywords: ["create", "post", "project", "new", "publish"],
    title: "Create a project",
    answer:
      "Go to New Project, complete title/description/tech stack, then click Post my project. Your project appears in the feed once saved.",
    actions: [
      { label: "Open New Project", to: "/projects/new" },
      { label: "View Feed", to: "/feed" },
    ],
  },
  {
    id: "messages",
    keywords: ["message", "dm", "chat", "talk", "contact", "collaborate"],
    title: "Direct messaging",
    answer:
      "Open Messages, pick a developer from the left panel, type your message, and send. You can ask for help or offer to collaborate.",
    actions: [{ label: "Open Messages", to: "/messages" }],
  },
  {
    id: "profile",
    keywords: ["profile", "name", "bio", "account", "settings"],
    title: "Update profile",
    answer:
      "Open Profile to update your display name and bio. Use Settings to send a password reset email or log out.",
    actions: [{ label: "Open Profile", to: "/profile" }],
  },
  {
    id: "comments",
    keywords: ["comment", "milestone", "request", "project details", "raise hand"],
    title: "Project interactions",
    answer:
      "Open any project details page to add comments, track milestones, and send collaboration requests.",
    actions: [{ label: "Open Feed", to: "/feed" }],
  },
  {
    id: "celebration",
    keywords: ["complete", "completed", "celebration", "wall", "ship"],
    title: "Celebration Wall",
    answer:
      "Mark your project as completed in Project Details. Completed projects show on the Celebration Wall.",
    actions: [{ label: "Open Celebration Wall", to: "/celebration-wall" }],
  },
  {
    id: "password",
    keywords: ["password", "forgot", "reset", "login", "sign in"],
    title: "Password help",
    answer:
      "Use Settings in the navbar and choose Change password to send yourself a reset email.",
    actions: [{ label: "Open Helped Settings", to: "/profile" }],
  },
];

// Handles FALLBACK RESPONSE.
const FALLBACK_RESPONSE = {
  title: "General help",
  answer:
    "I can help with creating projects, messaging developers, profile updates, comments, milestones, and celebration wall actions. Try asking one of those directly.",
  actions: [
    { label: "Open Feed", to: "/feed" },
    { label: "Open New Project", to: "/projects/new" },
    { label: "Open Messages", to: "/messages" },
  ],
};

// Handles scoreIntent.
function scoreIntent(question, intent) {
  const q = question.toLowerCase();
  let score = 0;

  for (const keyword of intent.keywords) {
    if (q.includes(keyword)) {
      score += 1;
    }
  }

  return score;
}

// Handles getHelpResponse.
export function getHelpResponse(question) {
  const text = (question || "").trim();
  if (!text) {
    return FALLBACK_RESPONSE;
  }

  let bestIntent = null;
  let bestScore = 0;

  for (const intent of HELP_INTENTS) {
    const nextScore = scoreIntent(text, intent);
    if (nextScore > bestScore) {
      bestScore = nextScore;
      bestIntent = intent;
    }
  }

  if (!bestIntent || bestScore === 0) {
    return FALLBACK_RESPONSE;
  }

  return {
    title: bestIntent.title,
    answer: bestIntent.answer,
    actions: bestIntent.actions,
  };
}

export const suggestedQuestions = [
  "How do I create a new project?",
  "How can I message another developer?",
  "How do I update my profile details?",
  "How do I post milestones and comments?",
  "How do I reset my password?",
];

