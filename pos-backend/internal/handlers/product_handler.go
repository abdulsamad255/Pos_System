package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"pos-backend/internal/models"
	"pos-backend/internal/repositories"
)

type ProductHandler struct {
	repo *repositories.ProductRepository
}

func NewProductHandler(repo *repositories.ProductRepository) *ProductHandler {
	return &ProductHandler{repo: repo}
}

func (h *ProductHandler) RegisterRoutes(r chi.Router) {
	r.Get("/products", h.GetProducts)
	r.Post("/products", h.CreateProduct)
	r.Get("/products/{id}", h.GetProductByID)
	r.Put("/products/{id}", h.UpdateProduct)
	r.Delete("/products/{id}", h.DeleteProduct)

	r.Get("/products/low-stock", h.GetLowStockProducts)
}

func (h *ProductHandler) GetProducts(w http.ResponseWriter, r *http.Request) {
	products, err := h.repo.GetAll(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch products")
		return
	}

	writeJSON(w, http.StatusOK, products)
}

func (h *ProductHandler) GetProductByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	product, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "product not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to fetch product")
		return
	}

	writeJSON(w, http.StatusOK, product)
}

type createProductRequest struct {
	Name  string  `json:"name"`
	SKU   string  `json:"sku"`
	Price float64 `json:"price"`
	Stock int64   `json:"stock"`
}

func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req createProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.Name == "" || req.SKU == "" {
		writeError(w, http.StatusBadRequest, "name and sku are required")
		return
	}

	p := &models.Product{
		Name:  req.Name,
		SKU:   req.SKU,
		Price: req.Price,
		Stock: req.Stock,
	}

	if err := h.repo.Create(r.Context(), p); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create product")
		return
	}

	writeJSON(w, http.StatusCreated, p)
}

type updateProductRequest struct {
	Name  string  `json:"name"`
	SKU   string  `json:"sku"`
	Price float64 `json:"price"`
	Stock int64   `json:"stock"`
}

func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	var req updateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.Name == "" || req.SKU == "" {
		writeError(w, http.StatusBadRequest, "name and sku are required")
		return
	}

	p := &models.Product{
		ID:    id,
		Name:  req.Name,
		SKU:   req.SKU,
		Price: req.Price,
		Stock: req.Stock,
	}

	if err := h.repo.Update(r.Context(), p); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update product")
		return
	}

	writeJSON(w, http.StatusOK, p)
}

func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid product id")
		return
	}

	if err := h.repo.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete product")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProductHandler) GetLowStockProducts(w http.ResponseWriter, r *http.Request) {
	thresholdStr := r.URL.Query().Get("threshold")
	var threshold int64 = 5 // default

	if thresholdStr != "" {
		val, err := strconv.ParseInt(thresholdStr, 10, 64)
		if err != nil || val < 0 {
			writeError(w, http.StatusBadRequest, "threshold must be a non-negative integer")
			return
		}
		threshold = val
	}

	products, err := h.repo.GetLowStock(r.Context(), threshold)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch low stock products")
		return
	}

	writeJSON(w, http.StatusOK, products)
}
