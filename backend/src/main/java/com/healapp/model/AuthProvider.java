package com.healapp.model;

public enum AuthProvider {
    LOCAL("Local"),
    GOOGLE("Google"),
    FACEBOOK("Facebook");
    
    private final String displayName;
    
    AuthProvider(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public static AuthProvider fromString(String value) {
        if (value == null) {
            return LOCAL;
        }
        
        try {
            return AuthProvider.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return LOCAL;
        }
    }
}
