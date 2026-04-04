CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
ON group_messages (group_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_user_group
ON group_members (user_id, group_id);
