CREATE TABLE IF NOT EXISTS pull_requests (
    id SERIAL PRIMARY KEY,
    github_id BIGINT NOT NULL,
    pr_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    contributor_login VARCHAR(255) NOT NULL,
    contributor_id BIGINT NOT NULL,
    repository VARCHAR(255) NOT NULL,
    merged_at TIMESTAMP WITH TIME ZONE,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    changed_files INTEGER DEFAULT 0,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    pull_request_id INTEGER NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
    reviewer_login VARCHAR(255) NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    approval_time_hours NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id SERIAL PRIMARY KEY,
    github_id BIGINT,
    title TEXT,
    contributor_login VARCHAR(255) NOT NULL,
    related_pr_number INTEGER,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pull_requests_contributor ON pull_requests(contributor_login);
CREATE INDEX IF NOT EXISTS idx_pull_requests_idempotency ON pull_requests(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_reviews_pr_id ON reviews(pull_request_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_contributor ON bug_reports(contributor_login);
