package repositories

import (
	"context"
	"database/sql"
	"time"
)

type ReportRepository struct {
	db *sql.DB
}

func NewReportRepository(db *sql.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

type SalesSummary struct {
	TotalSales   int64   `json:"total_sales"`
	TotalRevenue float64 `json:"total_revenue"`
	TotalItems   int64   `json:"total_items"`
}

type DailySalesRow struct {
	Date         string  `json:"date"`
	TotalSales   int64   `json:"total_sales"`
	TotalRevenue float64 `json:"total_revenue"`
}

type TopProductRow struct {
	ProductID   int64   `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int64   `json:"quantity"`
	Revenue     float64 `json:"revenue"`
}

func (r *ReportRepository) SalesSummary(ctx context.Context, from, to time.Time) (*SalesSummary, error) {
	query := `
SELECT
    COUNT(DISTINCT s.id) AS total_sales,
    COALESCE(SUM(s.total_amount), 0) AS total_revenue,
    COALESCE(SUM(si.quantity), 0) AS total_items
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.created_at >= ? AND s.created_at < ?;
`
	row := r.db.QueryRowContext(ctx, query, from, to)

	var summary SalesSummary
	if err := row.Scan(&summary.TotalSales, &summary.TotalRevenue, &summary.TotalItems); err != nil {
		return nil, err
	}

	return &summary, nil
}

func (r *ReportRepository) DailySales(ctx context.Context, from, to time.Time) ([]DailySalesRow, error) {
	query := `
SELECT
    DATE(s.created_at) AS day,
    COUNT(DISTINCT s.id) AS total_sales,
    COALESCE(SUM(s.total_amount), 0) AS total_revenue
FROM sales s
WHERE s.created_at >= ? AND s.created_at < ?
GROUP BY day
ORDER BY day;
`
	rows, err := r.db.QueryContext(ctx, query, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []DailySalesRow
	for rows.Next() {
		var row DailySalesRow
		if err := rows.Scan(&row.Date, &row.TotalSales, &row.TotalRevenue); err != nil {
			return nil, err
		}
		list = append(list, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}

func (r *ReportRepository) TopProducts(ctx context.Context, from, to time.Time, limit int) ([]TopProductRow, error) {
	if limit <= 0 {
		limit = 5
	}

	query := `
SELECT
    p.id AS product_id,
    p.name AS product_name,
    COALESCE(SUM(si.quantity), 0) AS quantity,
    COALESCE(SUM(si.line_total), 0) AS revenue
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
WHERE s.created_at >= ? AND s.created_at < ?
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT ?;
`

	rows, err := r.db.QueryContext(ctx, query, from, to, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []TopProductRow
	for rows.Next() {
		var row TopProductRow
		if err := rows.Scan(&row.ProductID, &row.ProductName, &row.Quantity, &row.Revenue); err != nil {
			return nil, err
		}
		list = append(list, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return list, nil
}
