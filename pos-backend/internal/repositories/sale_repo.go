package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"pos-backend/internal/models"
)

var (
	ErrInsufficientStock = errors.New("insufficient stock for product")
	ErrProductNotFound   = errors.New("product not found")
)

type SaleRepository struct {
	db *sql.DB
}

func NewSaleRepository(db *sql.DB) *SaleRepository {
	return &SaleRepository{db: db}
}

type CreateSaleItemParam struct {
	ProductID         int64
	Quantity          int64
	UnitPriceOverride *float64 // nil = use product price
}

type CreateSaleParams struct {
	Items         []CreateSaleItemParam
	PaymentMethod string
	PaidAmount    float64
}

func (r *SaleRepository) Create(ctx context.Context, params *CreateSaleParams) (*models.Sale, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	type itemPrepared struct {
		ProductID   int64
		ProductName string
		Quantity    int64
		UnitPrice   float64
		LineTotal   float64
	}

	var preparedItems []itemPrepared
	var total float64

	for _, it := range params.Items {
		var productName string
		var productPrice float64
		var stock int64

		row := tx.QueryRowContext(ctx,
			`SELECT name, price, stock FROM products WHERE id = ?`,
			it.ProductID,
		)

		if err = row.Scan(&productName, &productPrice, &stock); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				err = ErrProductNotFound
				return nil, err
			}
			return nil, err
		}

		if it.Quantity <= 0 {
			err = errors.New("quantity must be greater than zero")
			return nil, err
		}

		if stock < it.Quantity {
			err = ErrInsufficientStock
			return nil, err
		}

		unitPrice := productPrice
		if it.UnitPriceOverride != nil {
			unitPrice = *it.UnitPriceOverride
		}

		lineTotal := unitPrice * float64(it.Quantity)
		total += lineTotal

		preparedItems = append(preparedItems, itemPrepared{
			ProductID:   it.ProductID,
			ProductName: productName,
			Quantity:    it.Quantity,
			UnitPrice:   unitPrice,
			LineTotal:   lineTotal,
		})
	}

	createdAt := time.Now().UTC()

	res, err := tx.ExecContext(ctx,
		`INSERT INTO sales (total_amount, paid_amount, payment_method, created_at) VALUES (?, ?, ?, ?)`,
		total, params.PaidAmount, params.PaymentMethod, createdAt,
	)
	if err != nil {
		return nil, err
	}

	saleID, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	for _, item := range preparedItems {
		_, err = tx.ExecContext(ctx,
			`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
			saleID, item.ProductID, item.Quantity, item.UnitPrice, item.LineTotal, createdAt,
		)
		if err != nil {
			return nil, err
		}

		_, err = tx.ExecContext(ctx,
			`UPDATE products SET stock = stock - ? WHERE id = ?`,
			item.Quantity, item.ProductID,
		)
		if err != nil {
			return nil, err
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}

	sale := &models.Sale{
		ID:            saleID,
		TotalAmount:   total,
		PaidAmount:    params.PaidAmount,
		PaymentMethod: params.PaymentMethod,
		CreatedAt:     createdAt,
	}

	for _, item := range preparedItems {
		sale.Items = append(sale.Items, models.SaleItem{
			SaleID:      saleID,
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			LineTotal:   item.LineTotal,
			CreatedAt:   createdAt,
		})
	}

	return sale, nil
}

func (r *SaleRepository) GetAll(ctx context.Context) ([]models.Sale, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, total_amount, paid_amount, payment_method, created_at
         FROM sales ORDER BY id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sales []models.Sale
	for rows.Next() {
		var s models.Sale
		if err := rows.Scan(
			&s.ID,
			&s.TotalAmount,
			&s.PaidAmount,
			&s.PaymentMethod,
			&s.CreatedAt,
		); err != nil {
			return nil, err
		}
		sales = append(sales, s)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return sales, nil
}

func (r *SaleRepository) GetByID(ctx context.Context, id int64) (*models.Sale, error) {
	var s models.Sale

	row := r.db.QueryRowContext(ctx,
		`SELECT id, total_amount, paid_amount, payment_method, created_at
         FROM sales WHERE id = ?`,
		id,
	)

	if err := row.Scan(
		&s.ID,
		&s.TotalAmount,
		&s.PaidAmount,
		&s.PaymentMethod,
		&s.CreatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	itemsRows, err := r.db.QueryContext(ctx,
		`SELECT si.id, si.sale_id, si.product_id, p.name, si.quantity, si.unit_price, si.line_total, si.created_at
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?
         ORDER BY si.id`,
		id,
	)
	if err != nil {
		return nil, err
	}
	defer itemsRows.Close()

	for itemsRows.Next() {
		var item models.SaleItem
		if err := itemsRows.Scan(
			&item.ID,
			&item.SaleID,
			&item.ProductID,
			&item.ProductName,
			&item.Quantity,
			&item.UnitPrice,
			&item.LineTotal,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		s.Items = append(s.Items, item)
	}

	if err := itemsRows.Err(); err != nil {
		return nil, err
	}

	return &s, nil
}
