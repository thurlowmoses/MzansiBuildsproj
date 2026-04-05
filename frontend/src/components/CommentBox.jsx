import { useState } from "react";

function CommentBox({ onSubmit, loading = false }) {
	const [content, setContent] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();

		const trimmed = content.trim();
		if (!trimmed) {
			return;
		}

		await onSubmit(trimmed);
		setContent("");
	};

	return (
		<form onSubmit={handleSubmit} className="comment-box-form">
			<label htmlFor="comment-content">Add a comment</label>
			<textarea
				id="comment-content"
				rows={3}
				value={content}
				onChange={(event) => setContent(event.target.value)}
				placeholder="Share feedback, progress ideas, or encouragement..."
				required
			/>
			<button type="submit" disabled={loading}>
				{loading ? "Posting..." : "Post Comment"}
			</button>
		</form>
	);
}

export default CommentBox;
