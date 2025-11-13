package main

import (
	"fmt"
	"log"
	"net/http"

	"pos-backend/internal/config"
	"pos-backend/internal/database"
	"pos-backend/internal/handlers"
	"pos-backend/internal/repositories"
	"pos-backend/internal/router"
)

func main() {
	cfg := config.Load()

	db, err := database.NewSQLiteDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	defer db.Close()

	productRepo := repositories.NewProductRepository(db)
	saleRepo := repositories.NewSaleRepository(db)
	userRepo := repositories.NewUserRepository(db)
	reportRepo := repositories.NewReportRepository(db)

	productHandler := handlers.NewProductHandler(productRepo)
	saleHandler := handlers.NewSaleHandler(saleRepo)
	authHandler := handlers.NewAuthHandler(userRepo, cfg.JWTSecret)
	userHandler := handlers.NewUserHandler(userRepo, cfg.JWTSecret)
	reportHandler := handlers.NewReportHandler(reportRepo)

	r := router.NewRouter(productHandler, saleHandler, authHandler, userHandler, reportHandler)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server listening on %s ...", addr)

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
