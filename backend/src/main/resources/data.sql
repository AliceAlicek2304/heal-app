-- Initialize roles - SQL Server compatible version
-- For CUSTOMER role
IF NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'CUSTOMER')
    INSERT INTO roles (role_name, description, created_at, updated_at) 
    VALUES ('CUSTOMER', 'Regular customer role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ELSE
    UPDATE roles SET 
        description = 'Regular customer role',
        updated_at = CURRENT_TIMESTAMP
    WHERE role_name = 'CUSTOMER';

-- For CONSULTANT role
IF NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'CONSULTANT')
    INSERT INTO roles (role_name, description, created_at, updated_at) 
    VALUES ('CONSULTANT', 'Consultant role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ELSE
    UPDATE roles SET 
        description = 'Consultant role',
        updated_at = CURRENT_TIMESTAMP
    WHERE role_name = 'CONSULTANT';

-- For STAFF role
IF NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'STAFF')
    INSERT INTO roles (role_name, description, created_at, updated_at) 
    VALUES ('STAFF', 'Staff role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ELSE
    UPDATE roles SET 
        description = 'Staff role',
        updated_at = CURRENT_TIMESTAMP
    WHERE role_name = 'STAFF';

-- For ADMIN role
IF NOT EXISTS (SELECT 1 FROM roles WHERE role_name = 'ADMIN')
    INSERT INTO roles (role_name, description, created_at, updated_at) 
    VALUES ('ADMIN', 'Administrator role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ELSE
    UPDATE roles SET 
        description = 'Administrator role',
        updated_at = CURRENT_TIMESTAMP
    WHERE role_name = 'ADMIN';
