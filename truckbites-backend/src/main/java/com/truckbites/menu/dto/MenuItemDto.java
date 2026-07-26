package com.truckbites.menu.dto;

import com.truckbites.menu.entity.MenuItem;
import java.math.BigDecimal;

public class MenuItemDto {

    private Long id;
    private Long truckId;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private Integer quantityAvailable;
    private Boolean isAvailable;
    private String imageUrl;

    public MenuItemDto() {
    }

    public MenuItemDto(Long id, Long truckId, String name, String description, BigDecimal price,
                       String category, Integer quantityAvailable, Boolean isAvailable, String imageUrl) {
        this.id = id;
        this.truckId = truckId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.quantityAvailable = quantityAvailable;
        this.isAvailable = isAvailable;
        this.imageUrl = imageUrl;
    }

    public static MenuItemDto fromEntity(MenuItem item) {
        return MenuItemDto.builder()
                .id(item.getId())
                .truckId(item.getTruckId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .quantityAvailable(item.getQuantityAvailable())
                .isAvailable(item.getIsAvailable())
                .imageUrl(item.getImageUrl())
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

    public Long getTruckId() {
        return truckId;
    }

    public void setTruckId(Long truckId) {
        this.truckId = truckId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getQuantityAvailable() {
        return quantityAvailable;
    }

    public void setQuantityAvailable(Integer quantityAvailable) {
        this.quantityAvailable = quantityAvailable;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public static class Builder {
        private Long id;
        private Long truckId;
        private String name;
        private String description;
        private BigDecimal price;
        private String category;
        private Integer quantityAvailable;
        private Boolean isAvailable;
        private String imageUrl;

        Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder truckId(Long truckId) {
            this.truckId = truckId;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder price(BigDecimal price) {
            this.price = price;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder quantityAvailable(Integer quantityAvailable) {
            this.quantityAvailable = quantityAvailable;
            return this;
        }

        public Builder isAvailable(Boolean isAvailable) {
            this.isAvailable = isAvailable;
            return this;
        }

        public Builder imageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        public MenuItemDto build() {
            return new MenuItemDto(id, truckId, name, description, price, category, quantityAvailable, isAvailable, imageUrl);
        }
    }
}
