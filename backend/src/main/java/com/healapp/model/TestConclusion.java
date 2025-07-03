package com.healapp.model;

public enum TestConclusion {
    INFECTED("Bị nhiễm"),
    NOT_INFECTED("Không bị nhiễm"),
    ABNORMAL("Bất thường");

    private final String displayName;

    TestConclusion(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 