package models

import "time"

type Sale struct {
	ID            int64      `json:"id"`
	TotalAmount   float64    `json:"total_amount"`
	PaidAmount    float64    `json:"paid_amount"`
	PaymentMethod string     `json:"payment_method"`
	CreatedAt     time.Time  `json:"created_at"`
	Items         []SaleItem `json:"items,omitempty"`
}

type SaleItem struct {
	ID          int64     `json:"id"`
	SaleID      int64     `json:"sale_id"`
	ProductID   int64     `json:"product_id"`
	ProductName string    `json:"product_name,omitempty"`
	Quantity    int64     `json:"quantity"`
	UnitPrice   float64   `json:"unit_price"`
	LineTotal   float64   `json:"line_total"`
	CreatedAt   time.Time `json:"created_at"`
}
