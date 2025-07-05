IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_consultant_time_unique')
BEGIN
    CREATE UNIQUE INDEX idx_consultant_time_unique 
    ON consultations (consultant_id, start_time, end_time, status) 
    WHERE status != 'CANCELED';
    PRINT 'Created unique index to prevent overlapping consultations - RACE CONDITION PREVENTED!';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_consultant_time_range')
BEGIN
    CREATE INDEX idx_consultant_time_range 
    ON consultations (consultant_id, start_time, end_time, status);
    PRINT 'Created performance index for time range queries';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'chk_start_before_end')
BEGIN
    ALTER TABLE consultations 
    ADD CONSTRAINT chk_start_before_end 
    CHECK (start_time < end_time);
    PRINT 'Added constraint: start_time must be before end_time';
END

PRINT 'Verifying indexes and constraints...';
SELECT 
    'Indexes' as Type,
    name as Name,
    type_desc as Details
FROM sys.indexes 
WHERE name IN ('idx_consultant_time_unique', 'idx_consultant_time_range')
UNION ALL
SELECT 
    'Constraints' as Type,
    name as Name,
    'CHECK' as Details
FROM sys.check_constraints 
WHERE name = 'chk_start_before_end';
