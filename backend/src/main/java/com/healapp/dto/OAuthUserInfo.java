package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OAuthUserInfo {
    private String email;
    private String name;
    private String picture;
    private String providerId;
    private String provider;
}
