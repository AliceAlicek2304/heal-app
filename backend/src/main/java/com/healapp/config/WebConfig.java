package com.healapp.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve img files from uploads/img/
        String uploadPath = System.getProperty("user.dir") + "/uploads/img/";

        registry.addResourceHandler("/img/**")
                .addResourceLocations("file:" + uploadPath)
                .setCachePeriod(3600)
                .resourceChain(false);
    }

    @Override
    public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        // Tạo JSON converter hỗ trợ application/octet-stream
        MappingJackson2HttpMessageConverter jsonConverter = new MappingJackson2HttpMessageConverter();

        List<MediaType> supportedMediaTypes = new ArrayList<>();
        supportedMediaTypes.add(MediaType.APPLICATION_JSON);
        supportedMediaTypes.add(MediaType.APPLICATION_OCTET_STREAM); // Thêm support cho octet-stream
        supportedMediaTypes.add(MediaType.TEXT_PLAIN); // Thêm support cho text/plain

        jsonConverter.setSupportedMediaTypes(supportedMediaTypes);

        // Thêm converter vào đầu list để có priority cao
        converters.add(0, jsonConverter);
    }
}
