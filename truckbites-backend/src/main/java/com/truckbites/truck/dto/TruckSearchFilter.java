package com.truckbites.truck.dto;

public class TruckSearchFilter {

    private String cuisineType;
    private Double latitude;
    private Double longitude;
    private Double radiusKm;

    public TruckSearchFilter() {
        this.radiusKm = 5.0;
    }

    public TruckSearchFilter(String cuisineType, Double latitude, Double longitude, Double radiusKm) {
        this.cuisineType = cuisineType;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radiusKm = (radiusKm != null) ? radiusKm : 5.0;
    }

    public String getCuisineType() {
        return cuisineType;
    }

    public void setCuisineType(String cuisineType) {
        this.cuisineType = cuisineType;
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

    public Double getRadiusKm() {
        return radiusKm;
    }

    public void setRadiusKm(Double radiusKm) {
        this.radiusKm = (radiusKm != null) ? radiusKm : 5.0;
    }
}
