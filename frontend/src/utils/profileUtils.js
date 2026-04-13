// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

export function stageClass(stage) {
  // Handles map.
  const map = {
    idea: "profile-stage-idea",
    building: "profile-stage-building",
    beta: "profile-stage-beta",
    completed: "profile-stage-completed",
  };
  return map[stage] || "profile-stage-default";
}

