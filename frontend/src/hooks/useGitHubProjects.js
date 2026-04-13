// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

// hooks/useGitHubProjects.js
//
// WHY THIS EXISTS:
// When MzansiBuilds has no user posts yet, the feed looks empty.
// An empty feed is bad UX - new users see nothing and leave.
// We solve this by pulling real public projects from the GitHub API
// and showing them alongside user-created projects.
//
// WHY GITHUB API SPECIFICALLY:
// - Completely free, no API key needed for basic requests
// - Returns real developer projects - relevant to our audience
// - 60 requests per hour unauthenticated (plenty for a demo)
// - Data maps naturally to our ProjectCard fields
//
// HOW IT WORKS:
// GitHub's Search API lets us query repositories by various criteria.
// We fetch recently updated projects with good activity.
// We transform the GitHub response shape into our project card shape
// so the same ProjectCard component displays both types.

import { useState, useEffect } from "react";

// Handles useGitHubProjects.
const useGitHubProjects = (query = "language:javascript stars:>50", count = 8) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Handles fetchSearch.
    const fetchSearch = async (searchText) => {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchText)}&sort=updated&order=desc&per_page=${count}`;

      const response = await fetch(url, {
        headers: {
          // Telling GitHub we accept JSON - best practice
          Accept: "application/vnd.github.v3+json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data?.message || "GitHub API request failed";
        throw new Error(detail);
      }

      const transformed = (data.items || []).map((repo) => ({
        id: `github-${repo.id}`, // prefix so we know it is GitHub data
        title: repo.name,
        description: repo.description || "No description provided.",
        techStack: repo.language ? [repo.language] : [],
        stage: "building", // assume all active repos are building
        supportNeeded: "",
        userName: repo.owner?.login || "GitHub Developer",
        userId: `github-${repo.owner?.id}`,
        completed: false,
        stars: repo.stargazers_count,
        githubUrl: repo.html_url,
        isGitHub: true, // flag so UI can show a GitHub badge
        createdAt: repo.updated_at,
      }));

      return transformed;
    };

    // Handles fetchProjects.
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError("");

        let transformed = await fetchSearch(query);

        // Some complex query strings can return no items. Use a fallback query
        // so the seeded section still shows and the feed looks alive.
        if (transformed.length === 0) {
          transformed = await fetchSearch("stars:>500 archived:false");
        }

        setProjects(transformed);
      } catch (err) {
        // If GitHub API fails (rate limit, no internet), just show
        // nothing - do not break the whole feed over seed data
        setError(err?.message || "Could not load GitHub projects");
        setProjects([]);
        console.error("GitHub API error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [query, count]);

  return { projects, loading, error };
};

export default useGitHubProjects;

