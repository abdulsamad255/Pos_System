package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"pos-backend/internal/repositories"
)

type ReportHandler struct {
	repo *repositories.ReportRepository
}

func NewReportHandler(repo *repositories.ReportRepository) *ReportHandler {
	return &ReportHandler{repo: repo}
}

func (h *ReportHandler) RegisterRoutes(r chi.Router) {
	r.Get("/reports/summary", h.GetSummary)
	r.Get("/reports/daily", h.GetDaily)
	r.Get("/reports/top-products", h.GetTopProducts)
}

const dateLayout = "2006-01-02"

func parseDateRange(r *http.Request) (time.Time, time.Time, error) {
	q := r.URL.Query()
	fromStr := q.Get("from")
	toStr := q.Get("to")

	if fromStr == "" || toStr == "" {
		return time.Time{}, time.Time{}, ErrBadDateRange
	}

	from, err := time.Parse(dateLayout, fromStr)
	if err != nil {
		return time.Time{}, time.Time{}, ErrBadDateRange
	}

	to, err := time.Parse(dateLayout, toStr)
	if err != nil {
		return time.Time{}, time.Time{}, ErrBadDateRange
	}

	// make "to" exclusive end by adding one day
	to = to.Add(24 * time.Hour)

	return from, to, nil
}

var ErrBadDateRange = &badDateRangeError{}

type badDateRangeError struct{}

func (e *badDateRangeError) Error() string {
	return "invalid date range; use YYYY-MM-DD for from and to"
}

func (h *ReportHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	from, to, err := parseDateRange(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	summary, err := h.repo.SalesSummary(r.Context(), from, to)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch summary report")
		return
	}

	writeJSON(w, http.StatusOK, summary)
}

func (h *ReportHandler) GetDaily(w http.ResponseWriter, r *http.Request) {
	from, to, err := parseDateRange(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	rows, err := h.repo.DailySales(r.Context(), from, to)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch daily report")
		return
	}

	writeJSON(w, http.StatusOK, rows)
}

func (h *ReportHandler) GetTopProducts(w http.ResponseWriter, r *http.Request) {
	from, to, err := parseDateRange(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	limit := 5
	limitStr := r.URL.Query().Get("limit")
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
			limit = v
		} else {
			writeError(w, http.StatusBadRequest, "limit must be a positive integer")
			return
		}
	}

	rows, err := h.repo.TopProducts(r.Context(), from, to, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch top products")
		return
	}

	writeJSON(w, http.StatusOK, rows)
}
