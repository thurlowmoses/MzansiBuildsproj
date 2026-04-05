import { useState } from "react";

function CodeBlock({ title, language = "text", code, showCopy = true }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (!navigator?.clipboard || !code) return;

		await navigator.clipboard.writeText(code);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	return (
		<figure className="code-block">
			{title ? (
				<header className="code-block-header">
					<strong>{title}</strong>
					<span>{language}</span>
				</header>
			) : null}
			<pre className="code-block-pre">
				<code>{code}</code>
			</pre>
			{showCopy ? (
				<button type="button" className="code-block-copy" onClick={handleCopy}>
					{copied ? "Copied" : "Copy"}
				</button>
			) : null}
		</figure>
	);
}

export default CodeBlock;
