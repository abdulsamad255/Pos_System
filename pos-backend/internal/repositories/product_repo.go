package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"pos-backend/internal/models"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) GetAll(ctx context.Context) ([]models.Product, error) {
	query := `SELECT id, name, sku, price, stock, created_at, updated_at FROM products ORDER BY id DESC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.SKU,
			&p.Price,
			&p.Stock,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}

func (r *ProductRepository) GetByID(ctx context.Context, id int64) (*models.Product, error) {
	query := `SELECT id, name, sku, price, stock, created_at, updated_at FROM products WHERE id = ?`
	row := r.db.QueryRowContext(ctx, query, id)

	var p models.Product
	err := row.Scan(
		&p.ID,
		&p.Name,
		&p.SKU,
		&p.Price,
		&p.Stock,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	return &p, nil
}

func (r *ProductRepository) Create(ctx context.Context, p *models.Product) error {
	now := time.Now().UTC()

	query := `INSERT INTO products (name, sku, price, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
	res, err := r.db.ExecContext(ctx, query, p.Name, p.SKU, p.Price, p.Stock, now, now)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}

	p.ID = id
	p.CreatedAt = now
	p.UpdatedAt = now

	return nil
}

func (r *ProductRepository) Update(ctx context.Context, p *models.Product) error {
	now := time.Now().UTC()

	query := `UPDATE products SET name = ?, sku = ?, price = ?, stock = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, p.Name, p.SKU, p.Price, p.Stock, now, p.ID)
	if err != nil {
		return err
	}

	p.UpdatedAt = now
	return nil
}

func (r *ProductRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM products WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *ProductRepository) GetLowStock(ctx context.Context, threshold int64) ([]models.Product, error) {
	query := `SELECT id, name, sku, price, stock, created_at, updated_at
	          FROM products
	          WHERE stock <= ?
	          ORDER BY stock ASC, id ASC`

	rows, err := r.db.QueryContext(ctx, query, threshold)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.SKU,
			&p.Price,
			&p.Stock,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}
