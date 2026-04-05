import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHelpResponse, suggestedQuestions } from "../utils/helpAssistant";
import "../styles/help.css";

function HelpPage() {
  const [question, setQuestion] = useState("");
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

  const canAsk = useMemo(() => question.trim().length > 0, [question]);

  const askQuestion = (text) => {
    const cleaned = text.trim();
    if (!cleaned) {
      return;
    }

    const response = getHelpResponse(cleaned);

    setHistory((prev) => [
      ...prev,
      {
        role: "user",
        answer: cleaned,
      },
      {
        role: "assistant",
        title: response.title,
        answer: response.answer,
        actions: response.actions || [],
      },
    ]);

    setQuestion("");
  };

  const onSubmit = (event) => {
    event.preventDefault();
    askQuestion(question);
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
          {suggestedQuestions.map((item) => (
            <button key={item} type="button" onClick={() => askQuestion(item)}>
              {item}
            </button>
          ))}
        </section>

        <section className="help-chat" aria-live="polite">
          {history.map((entry, index) => (
            <article
              key={`${entry.role}-${index}`}
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
          <label htmlFor="help-question">Ask a question</label>
          <textarea
            id="help-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: How do I send a collaboration request?"
          />
          <button type="submit" disabled={!canAsk}>
            Ask assistant
          </button>
        </form>
      </section>
    </main>
  );
}

export default HelpPage;
