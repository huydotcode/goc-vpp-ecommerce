package com.example.learnspring1.domain;

public enum VariantType {
    COLOR("Màu sắc"),
    SIZE("Kích thước"),
    MATERIAL("Chất liệu"),
    STYLE("Kiểu dáng"),
    PATTERN("Họa tiết"),
    CAPACITY("Dung tích"),
    WEIGHT("Trọng lượng"),
    PACKAGE("Đóng gói"),
    OTHER("Khác");

    private final String displayName;

    VariantType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

