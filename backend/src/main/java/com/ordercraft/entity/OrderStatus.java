package com.ordercraft.entity;

public enum OrderStatus {
    DRAFT,
    CONFIRMED,
    MATERIAL_CHECK,
    SHORTAGE,
    READY_FOR_PRODUCTION,
    IN_PRODUCTION,
    COMPLETED,
    INVOICED,
    PARTIALLY_PAID,
    PAID,
    CANCELLED
}
