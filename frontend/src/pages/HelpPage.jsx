import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CodeBlock from "../components/CodeBlock";
import { streamHelpResponse } from "../api/backendClient";
import { getHelpResponse, suggestedQuestions } from "../utils/helpAssistant";
import "../styles/help.css";

function HelpPage() {
  const location = useLocation();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState([
    {
      role: "assistant",
      title: "Mzansi AI Help",
      answer:
        "Ask me how to use MzansiBuilds. I can guide you through projects, messaging, profile settings, milestones, and collaboration.",
      actions: [
        { label: "Go to Feed", to: "/feed" },
        { label: "Create Project", to: "/projects/new" },
      ],
    },
  ]);

  const canAsk = useMemo(() => question.trim().length > 0 && !asking, [question, asking]);
useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preset = params.get("question") || "";
    if (preset) {
      setQuestion(preset);
    }
  }, [location.search]);

  
  const askQuestion = async (text) => {
	// Append the prompt and the assistant reply together.
    const cleaned = text.trim();
    if (!cleaned) {
      return;
    }

    const response = getHelpResponse(cleaned);
    const assistantId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    setHistory((prev) => [
      ...prev,
      {
        id: `${assistantId}_user`,
        role: "user",
        answer: cleaned,
      },
      {
        id: assistantId,
        role: "assistant",
        title: "Mzansi AI Help",
        answer: "",
        actions: response.actions || [],
      },
    ]);

    setQuestion("");

    try {
      setAsking(true);
      await streamHelpResponse(cleaned, (chunk) => {
        setHistory((prev) =>
          prev.map((entry) =>
            entry.id === assistantId
              ? {
                  ...entry,
                  answer: `${entry.answer || ""}${chunk}`,
                }
              : entry
          )
        );
      });
    } catch (error) {
      setHistory((prev) =>
        prev.map((entry) =>
          entry.id === assistantId
            ? {
                ...entry,
                title: response.title,
                answer: response.answer,
              }
            : entry
        )
      );
    } finally {
      setAsking(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    void askQuestion(question);
  };

  return (
    <main className="help-page">
      <section className="help-container">
        <header className="help-header">
          <h1>Need help using MzansiBuilds?</h1>
          <p>
            Use this assistant to learn where to click and what to do next. It helps new users
            navigate quickly.
          </p>
        </header>

        <section className="help-suggestions">
          {/* One-tap prompts. */}
          {suggestedQuestions.map((item) => (
            <button key={item} type="button" onClick={() => void askQuestion(item)} disabled={asking}>
              {item}
            </button>
          ))}
        </section>

        <section className="help-examples">
          <h2>Quick examples</h2>
          <CodeBlock
            title="Create a project"
            language="jsx"
            code={`await addDoc(collection(db, "projects"), {
  title: "MzansiBuilds",
  description: "A platform for developers building in public.",
  createdAt: serverTimestamp(),
});`}
          />
          <CodeBlock
            title="Send a collaboration request"
            language="jsx"
            code={`await addDoc(collection(db, "collabRequests"), {
  projectId: project.id,
  fromUserId: user.uid,
  message: "I can help with the frontend.",
  status: "pending",
});`}
          />
        </section>

        <section className="help-chat" aria-live="polite">
          {/* Conversation history. */}
          {history.map((entry, index) => (
            <article
              key={entry.id || `${entry.role}-${index}`}
              className={`help-message ${entry.role === "assistant" ? "assistant" : "user"}`}
            >
              {entry.title ? <h2>{entry.title}</h2> : null}
              <p>{entry.answer}</p>
              {Array.isArray(entry.actions) && entry.actions.length > 0 ? (
                <div className="help-actions">
                  {entry.actions.map((action) => (
                    <Link key={`${action.to}-${action.label}`} to={action.to}>
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <form className="help-form" onSubmit={onSubmit}>
          {/* Freeform question input. */}
          <label htmlFor="help-question">Ask a question</label>
          <textarea
            id="help-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: How do I send a collaboration request?"
          />
          <button type="submit" disabled={!canAsk}>
            {asking ? "Thinking..." : "Ask assistant"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default HelpPage;
