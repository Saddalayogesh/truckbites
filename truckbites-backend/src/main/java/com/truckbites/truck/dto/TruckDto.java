package com.truckbites.truck.dto;

import com.truckbites.truck.entity.Truck;
import com.truckbites.truck.entity.TruckStatus;

public class TruckDto {

    private Long id;
    private String name;
    private String cuisineType;
    private String description;
    private Double latitude;
    private Double longitude;
    private TruckStatus status;
    private String imageUrl;
    private Long ownerId;

    public TruckDto() {
    }

    public TruckDto(Long id, String name, String cuisineType, String description, Double latitude,
                    Double longitude, TruckStatus status, String imageUrl, Long ownerId) {
        this.id = id;
        this.name = name;
        this.cuisineType = cuisineType;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.imageUrl = imageUrl;
        this.ownerId = ownerId;
    }

    public static TruckDto fromEntity(Truck truck) {
        return TruckDto.builder()
                .id(truck.getId())
                .name(truck.getName())
                .cuisineType(truck.getCuisineType())
                .description(truck.getDescription())
                .latitude(truck.getLatitude())
                .longitude(truck.getLongitude())
                .status(truck.getStatus())
                .imageUrl(truck.getImageUrl())
                .ownerId(truck.getOwnerId())
                .build();
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCuisineType() {
        return cuisineType;
    }

    public void setCuisineType(String cuisineType) {
        this.cuisineType = cuisineType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public TruckStatus getStatus() {
        return status;
    }

    public void setStatus(TruckStatus status) {
        this.status = status;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public static class Builder {
        private Long id;
        private String name;
        private String cuisineType;
        private String description;
        private Double latitude;
        private Double longitude;
        private TruckStatus status;
        private String imageUrl;
        private Long ownerId;

        Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder cuisineType(String cuisineType) {
            this.cuisineType = cuisineType;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder latitude(Double latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder longitude(Double longitude) {
            this.longitude = longitude;
            return this;
        }

        public Builder status(TruckStatus status) {
            this.status = status;
            return this;
        }

        public Builder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public Builder ownerId(Long ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        public TruckDto build() {
            return new TruckDto(id, name, cuisineType, description, latitude, longitude, status, imageUrl, ownerId);
        }
    }
}
