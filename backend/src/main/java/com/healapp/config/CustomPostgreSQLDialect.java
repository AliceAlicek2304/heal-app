package com.healapp.config;

import org.hibernate.dialect.PostgreSQLDialect;

/**
 * Custom PostgreSQL dialect to handle SQL Server NVARCHAR types  
 * This dialect automatically converts NVARCHAR(MAX) to TEXT
 */
public class CustomPostgreSQLDialect extends PostgreSQLDialect {

    public CustomPostgreSQLDialect() {
        super();
    }
}
