package models

import "time"

type Product struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	SKU       string    `json:"sku"`
	Price     float64   `json:"price"`
	Stock     int64     `json:"stock"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
