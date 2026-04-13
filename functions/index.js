// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// Keep the starter cost-friendly.
setGlobalOptions({ maxInstances: 10 });

// Simple health endpoint for local checks.
exports.health = onRequest((request, response) => {
	logger.info("Health check hit", {structuredData: true});
	response.status(200).send("ok");
});

