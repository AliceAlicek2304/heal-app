package com.healapp.service;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.healapp.dto.OAuthUserInfo;

@Service
public class GoogleOAuthService {

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    public OAuthUserInfo verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), 
                    new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

            GoogleIdToken token = verifier.verify(idToken);
            if (token != null) {
                GoogleIdToken.Payload payload = token.getPayload();
                
                OAuthUserInfo userInfo = new OAuthUserInfo();
                userInfo.setEmail(payload.getEmail());
                userInfo.setName((String) payload.get("name"));
                userInfo.setPicture((String) payload.get("picture"));
                userInfo.setProviderId(payload.getSubject());
                userInfo.setProvider("GOOGLE");
                
                return userInfo;
            }
        } catch (Exception e) {
            throw new RuntimeException("Invalid Google token", e);
        }
        
        return null;
    }
}
