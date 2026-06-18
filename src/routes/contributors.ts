import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

export const contributorsRouter = Router();

contributorsRouter.get('/:github_handle/scorecard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { github_handle } = req.params;

    if (!github_handle || typeof github_handle !== 'string') {
      throw new AppError(400, 'Invalid contributor handle');
    }

    const { query } = await import('../db');

    const scorecardResult = await query(
      `SELECT
        c.github_handle,
        c.display_name,
        COUNT(DISTINCT pr.id) AS total_prs,
        COUNT(DISTINCT r.id) AS total_reviews,
        COUNT(DISTINCT b.id) AS total_bugs,
        COALESCE(AVG(r.approval_time_hours), 0) AS avg_approval_hours,
        COALESCE(
          (COUNT(DISTINCT CASE WHEN b.id IS NOT NULL AND b.resolved = true THEN b.id END)::float /
           NULLIF(COUNT(DISTINCT b.id), 0)) * 100,
          0
        ) AS bug_resolution_rate,
        COALESCE(
          CASE
            WHEN COUNT(DISTINCT pr.id) > 0 THEN
              (COUNT(DISTINCT CASE WHEN pr.merged_at IS NOT NULL THEN pr.id END)::float /
               COUNT(DISTINCT pr.id)) * 100
            ELSE 0
          END, 0
        ) AS merge_rate,
        COALESCE(
          CASE
            WHEN COUNT(DISTINCT pr.id) > 0 THEN
              LEAST(
                (COUNT(DISTINCT CASE WHEN r.id IS NOT NULL AND r.approved = true THEN r.id END)::float /
                 NULLIF(COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN r.id END), 0)) * 50 +
                (100 - LEAST(COALESCE(AVG(r.approval_time_hours), 48) / 48 * 50, 50)) -
                (COUNT(DISTINCT b.id)::float / NULLIF(COUNT(DISTINCT pr.id), 0)) * 10,
                100
              )
            ELSE 50
          END, 50
        ) AS code_quality_score
      FROM (
        SELECT $1::text AS github_handle, $1::text AS display_name
      ) c
      LEFT JOIN pull_requests pr ON pr.contributor_login = c.github_handle
      LEFT JOIN reviews r ON r.pull_request_id = pr.id
      LEFT JOIN bug_reports b ON b.contributor_login = c.github_handle
      GROUP BY c.github_handle, c.display_name`,
      [github_handle]
    );

    if (scorecardResult.rows.length === 0) {
      throw new AppError(404, 'Contributor not found');
    }

    const scorecard = scorecardResult.rows[0];

    res.json({
      contributor: github_handle,
      scorecard: {
        total_pull_requests: parseInt(scorecard.total_prs) || 0,
        total_reviews: parseInt(scorecard.total_reviews) || 0,
        total_bug_reports: parseInt(scorecard.total_bugs) || 0,
        avg_approval_time_hours: parseFloat(scorecard.avg_approval_hours) || 0,
        bug_resolution_rate: parseFloat(scorecard.bug_resolution_rate) || 0,
        merge_rate: parseFloat(scorecard.merge_rate) || 0,
        code_quality_score: parseFloat(scorecard.code_quality_score) || 50,
      },
      computed_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
