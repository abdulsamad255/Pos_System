package models

import "time"

type User struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`    // never exposed in JSON
	Role         string    `json:"role"` // "manager" or "cashier"
	CreatedAt    time.Time `json:"created_at"`
}
