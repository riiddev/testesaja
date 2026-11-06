/**
 * GET /api/story/get
 * 
 * Retrieves story progress for active user.
 */

import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { authenticateRequest } from "../_lib/auth.js";
import { sendSuccess, sendAuthError, sendServerError } from "../_lib/response.js";

export default async function handler(req, res) {
  try {
    const { user } = await authenticateRequest(req);
    const url = new URL(req.url, "http://localhost");
    const storyId = url.searchParams.get("storyId") || "story_1";

    const rows = await db
      .select()
      .from(schema.storyProgress)
      .where(eq(schema.storyProgress.userId, user.id));

    const storyMap = {};
    for (const r of rows) {
      storyMap[r.storyId] = {
        storyId: r.storyId,
        currentEpisode: r.currentEpisode,
        completedEpisodes: Array.isArray(r.completedEpisodes) ? r.completedEpisodes : [],
        isStoryCompleted: r.isStoryCompleted
      };
    }

    const currentStory = storyMap[storyId] || {
      storyId,
      currentEpisode: 1,
      completedEpisodes: [],
      isStoryCompleted: false
    };

    return sendSuccess(res, {
      storyId,
      currentEpisode: currentStory.currentEpisode,
      completedEpisodes: currentStory.completedEpisodes,
      isStoryCompleted: currentStory.isStoryCompleted,
      allStories: storyMap
    });
  } catch (err) {
    if (err.statusCode === 401 || err.code === "AUTH_ERROR") {
      return sendAuthError(res, err.message, 401);
    }
    console.error("[API story/get] Error:", err);
    return sendServerError(res, "Gagal memuat progres petualangan: " + err.message);
  }
}

