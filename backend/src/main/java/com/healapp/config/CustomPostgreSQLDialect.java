package com.healapp.config;

import org.hibernate.dialect.PostgreSQLDialect;
import org.hibernate.dialect.DatabaseVersion;

/**
 * Custom PostgreSQL dialect to handle SQL Server NVARCHAR types  
 * This dialect automatically converts NVARCHAR(MAX) to TEXT
 */
public class CustomPostgreSQLDialect extends PostgreSQLDialect {

    public CustomPostgreSQLDialect() {
        super(DatabaseVersion.make(12));
    }
    
    @Override
    protected String columnType(int sqlTypeCode) {
        // Override NVARCHAR types to TEXT
        switch (sqlTypeCode) {
            case java.sql.Types.NVARCHAR:
            case java.sql.Types.LONGNVARCHAR:
            case java.sql.Types.NCHAR:
                return "text";
            default:
                return super.columnType(sqlTypeCode);
        }
    }
}
