package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"pos-backend/internal/repositories"
)

type SaleHandler struct {
	repo *repositories.SaleRepository
}

func NewSaleHandler(repo *repositories.SaleRepository) *SaleHandler {
	return &SaleHandler{repo: repo}
}

func (h *SaleHandler) RegisterRoutes(r chi.Router) {
	r.Get("/sales", h.GetSales)
	r.Post("/sales", h.CreateSale)
	r.Get("/sales/{id}", h.GetSaleByID)
}

type createSaleItemRequest struct {
	ProductID int64    `json:"product_id"`
	Quantity  int64    `json:"quantity"`
	UnitPrice *float64 `json:"unit_price,omitempty"` // optional override
}

type createSaleRequest struct {
	Items         []createSaleItemRequest `json:"items"`
	PaymentMethod string                  `json:"payment_method"`
	PaidAmount    float64                 `json:"paid_amount"`
}

func (h *SaleHandler) CreateSale(w http.ResponseWriter, r *http.Request) {
	var req createSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	if len(req.Items) == 0 {
		writeError(w, http.StatusBadRequest, "at least one item is required")
		return
	}
	if req.PaymentMethod == "" {
		writeError(w, http.StatusBadRequest, "payment_method is required")
		return
	}
	if req.PaidAmount < 0 {
		writeError(w, http.StatusBadRequest, "paid_amount must be >= 0")
		return
	}

	var items []repositories.CreateSaleItemParam
	for _, it := range req.Items {
		if it.ProductID <= 0 {
			writeError(w, http.StatusBadRequest, "invalid product_id")
			return
		}
		if it.Quantity <= 0 {
			writeError(w, http.StatusBadRequest, "quantity must be > 0")
			return
		}
		items = append(items, repositories.CreateSaleItemParam{
			ProductID:         it.ProductID,
			Quantity:          it.Quantity,
			UnitPriceOverride: it.UnitPrice,
		})
	}

	params := &repositories.CreateSaleParams{
		Items:         items,
		PaymentMethod: req.PaymentMethod,
		PaidAmount:    req.PaidAmount,
	}

	sale, err := h.repo.Create(r.Context(), params)
	if err != nil {
		if errors.Is(err, repositories.ErrProductNotFound) {
			writeError(w, http.StatusBadRequest, "one or more products not found")
			return
		}
		if errors.Is(err, repositories.ErrInsufficientStock) {
			writeError(w, http.StatusBadRequest, "insufficient stock for one or more products")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create sale")
		return
	}

	writeJSON(w, http.StatusCreated, sale)
}

func (h *SaleHandler) GetSales(w http.ResponseWriter, r *http.Request) {
	sales, err := h.repo.GetAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch sales")
		return
	}
	writeJSON(w, http.StatusOK, sales)
}

func (h *SaleHandler) GetSaleByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid sale id")
		return
	}

	sale, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "sale not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to fetch sale")
		return
	}

	writeJSON(w, http.StatusOK, sale)
}
