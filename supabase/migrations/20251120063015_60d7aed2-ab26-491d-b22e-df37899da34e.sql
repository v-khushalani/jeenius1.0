-- Add unique constraint for topic_mastery upserts
ALTER TABLE topic_mastery
ADD CONSTRAINT topic_mastery_user_subject_chapter_topic_key 
UNIQUE (user_id, subject, chapter, topic);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_accuracy 
ON topic_mastery(user_id, accuracy DESC);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_user_questions 
ON topic_mastery(user_id, questions_attempted DESC);