-- 6.2 Asset Groups/Tags
CREATE TABLE IF NOT EXISTS asset_tags (
    asset_id  UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (asset_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_asset_tags_tag ON asset_tags(tag);
