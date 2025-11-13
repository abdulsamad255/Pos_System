package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"pos-backend/internal/auth"
	"pos-backend/internal/models"
	"pos-backend/internal/repositories"
)

type AuthHandler struct {
	userRepo  *repositories.UserRepository
	jwtSecret string
}

func NewAuthHandler(userRepo *repositories.UserRepository, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

func (h *AuthHandler) RegisterRoutes(r interface {
	Post(pattern string, handlerFn http.HandlerFunc)
}) {
	r.Post("/auth/register", h.Register)
	r.Post("/auth/login", h.Login)
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // "manager" or "cashier"
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Role = strings.TrimSpace(strings.ToLower(req.Role))

	if req.Name == "" || req.Email == "" || req.Password == "" || req.Role == "" {
		writeError(w, http.StatusBadRequest, "name, email, password and role are required")
		return
	}

	if req.Role != "manager" && req.Role != "cashier" {
		writeError(w, http.StatusBadRequest, "role must be 'manager' or 'cashier'")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	user := &models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         req.Role,
	}

	if err := h.userRepo.Create(r.Context(), user); err != nil {
		// crude way to detect unique email violations for SQLite
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			writeError(w, http.StatusBadRequest, "email already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	// no password in response (PasswordHash has json:"-")
	writeJSON(w, http.StatusCreated, user)
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	user, err := h.userRepo.GetByEmail(r.Context(), email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to fetch user")
		return
	}

	if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Role, h.jwtSecret, 24*time.Hour)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	resp := loginResponse{
		Token: token,
		User:  user,
	}

	writeJSON(w, http.StatusOK, resp)
}
