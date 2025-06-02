package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.service.AppConfigService;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/config")
public class AppConfigController {

    @Autowired
    private AppConfigService appConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getCurrentConfig() {
        ApiResponse<Map<String, String>> response = appConfigService.getCurrentConfig();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<String>> getConfigByKey(@PathVariable String key) {
        ApiResponse<String> response = appConfigService.getConfigByKey(key);
        return getResponseEntity(response);
    }

    private <T> ResponseEntity<ApiResponse<T>> getResponseEntity(ApiResponse<T> response) {
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}