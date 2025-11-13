package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"

	"pos-backend/internal/auth"
	"pos-backend/internal/repositories"
)

type UserHandler struct {
	userRepo  *repositories.UserRepository
	jwtSecret string
}

func NewUserHandler(userRepo *repositories.UserRepository, jwtSecret string) *UserHandler {
	return &UserHandler{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

func (h *UserHandler) RegisterRoutes(r interface {
	Get(pattern string, handlerFn http.HandlerFunc)
}) {
	r.Get("/users/me", h.Me)
}

func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		writeError(w, http.StatusUnauthorized, "missing Authorization header")
		return
	}

	if !strings.HasPrefix(authHeader, "Bearer ") {
		writeError(w, http.StatusUnauthorized, "invalid Authorization header format")
		return
	}

	tokenStr := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))

	claims, err := auth.ParseToken(tokenStr, h.jwtSecret)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid or expired token")
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), claims.UserID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "user not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to fetch user")
		return
	}

	writeJSON(w, http.StatusOK, user)
}
