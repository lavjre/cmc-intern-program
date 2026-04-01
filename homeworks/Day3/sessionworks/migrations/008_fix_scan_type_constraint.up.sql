-- Extend scan_type CHECK constraint to include 'all' and 'cert_trans'.
-- Safe to run on existing databases — drops and recreates the constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'scan_jobs_scan_type_check'
      AND table_name = 'scan_jobs'
  ) THEN
    ALTER TABLE scan_jobs DROP CONSTRAINT scan_jobs_scan_type_check;
  END IF;

  ALTER TABLE scan_jobs ADD CONSTRAINT scan_jobs_scan_type_check
    CHECK (scan_type IN ('all','dns','whois','subdomain','port','ssl','tech','ip','asn','cert_trans'));
END $$;
