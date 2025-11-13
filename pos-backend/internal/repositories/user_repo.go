package repositories

import (
	"context"
	"database/sql"
	"time"

	"pos-backend/internal/models"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, u *models.User) error {
	now := time.Now().UTC()

	res, err := r.db.ExecContext(ctx,
		`INSERT INTO users (name, email, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, ?)`,
		u.Name, u.Email, u.PasswordHash, u.Role, now,
	)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}

	u.ID = id
	u.CreatedAt = now
	return nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, name, email, password_hash, role, created_at
         FROM users WHERE email = ?`,
		email,
	)

	var u models.User
	if err := row.Scan(
		&u.ID,
		&u.Name,
		&u.Email,
		&u.PasswordHash,
		&u.Role,
		&u.CreatedAt,
	); err != nil {
		return nil, err
	}

	return &u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*models.User, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, name, email, password_hash, role, created_at
         FROM users WHERE id = ?`,
		id,
	)

	var u models.User
	if err := row.Scan(
		&u.ID,
		&u.Name,
		&u.Email,
		&u.PasswordHash,
		&u.Role,
		&u.CreatedAt,
	); err != nil {
		return nil, err
	}

	return &u, nil
}
