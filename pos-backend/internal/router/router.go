package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"pos-backend/internal/handlers"
)

func NewRouter(
	productHandler *handlers.ProductHandler,
	saleHandler *handlers.SaleHandler,
	authHandler *handlers.AuthHandler,
	userHandler *handlers.UserHandler,
	reportHandler *handlers.ReportHandler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	r.Route("/api", func(api chi.Router) {
		productHandler.RegisterRoutes(api)
		saleHandler.RegisterRoutes(api)
		authHandler.RegisterRoutes(api)
		userHandler.RegisterRoutes(api)
		reportHandler.RegisterRoutes(api)
	})

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
