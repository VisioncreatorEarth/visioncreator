-- Create function to update proposal state based on vote count
CREATE OR REPLACE FUNCTION update_proposal_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Update proposal state based on vote count thresholds
  UPDATE proposals
  SET state = 
    CASE 
      WHEN NEW.total_tokens_staked >= 25 THEN 'decision'::text
      WHEN NEW.total_tokens_staked >= 10 THEN 'draft'::text
      ELSE 'idea'::text
    END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after proposal votes are updated
DROP TRIGGER IF EXISTS update_proposal_state_trigger ON proposals;
CREATE TRIGGER update_proposal_state_trigger
  AFTER UPDATE OF total_tokens_staked ON proposals
  FOR EACH ROW
  WHEN (OLD.total_tokens_staked IS DISTINCT FROM NEW.total_tokens_staked)
  EXECUTE FUNCTION update_proposal_state();

-- Add comment explaining the trigger
COMMENT ON TRIGGER update_proposal_state_trigger ON proposals IS 
  'Automatically updates proposal state based on total tokens staked:
   - Below 10 tokens: idea
   - 10-24 tokens: draft
   - 25+ tokens: decision'; 