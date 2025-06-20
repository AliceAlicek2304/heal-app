package com.healapp.model;

public enum Gender {
    MALE("Nam"),
    FEMALE("Nữ"),
    OTHER("Khác");

    private final String displayName;

    Gender(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static Gender fromDisplayName(String displayName) {
        for (Gender gender : Gender.values()) {
            if (gender.displayName.equalsIgnoreCase(displayName)) {
                return gender;
            }
        }
        throw new IllegalArgumentException("Invalid gender: " + displayName);
    }
}