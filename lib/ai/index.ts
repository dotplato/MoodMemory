/**
 * AI feature hooks — reserved for future implementation.
 *
 * Planned capabilities:
 * - Auto-tagging from image content
 * - Style classification
 * - Dominant color extraction → dominantColors[]
 * - Similar-image search
 * - Visual semantic search
 *
 * Metadata fields (aiTags, aiDescription, dominantColors) are already
 * persisted in Drive and indexed for search.
 */

export interface AIProcessingJob {
  imageId: string
  imageDriveId: string
  status: "pending" | "processing" | "completed" | "failed"
  createdAt: string
}

export interface AIProcessingResult {
  aiTags: string[]
  aiDescription: string
  dominantColors: string[]
}

/** Placeholder — wire to a queue/worker when AI is enabled. */
export async function enqueueAIProcessing(
  _job: Omit<AIProcessingJob, "status" | "createdAt">
): Promise<AIProcessingJob> {
  throw new Error("AI processing is not enabled yet")
}

/** Placeholder — apply AI results back to Drive metadata. */
export async function applyAIResults(
  _imageId: string,
  _result: AIProcessingResult
): Promise<void> {
  throw new Error("AI processing is not enabled yet")
}
