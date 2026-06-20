package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/internal/services"
	"ticket-reservation-system/pkg/utils"
)

type AdminHandler struct {
	adminUserService *services.AdminUserService
}

func NewAdminHandler(adminUserService *services.AdminUserService) *AdminHandler {
	return &AdminHandler{adminUserService: adminUserService}
}

// GetAllUsers godoc
// @Summary Get all users (Admin)
// @Tags admin-users
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/users [get]
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	users, err := h.adminUserService.GetAllUsers()
	if err != nil {
		utils.InternalError(c, "خطا در دریافت لیست کاربران")
		return
	}

	utils.Success(c, http.StatusOK, users)
}

// ToggleUserStatus godoc
// @Summary Toggle user active/inactive status (Admin)
// @Tags admin-users
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/users/{id}/toggle-status [put]
func (h *AdminHandler) ToggleUserStatus(c *gin.Context) {
	adminID, _ := uuid.Parse(c.GetString("userID"))

	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه کاربر نامعتبر است")
		return
	}

	if err := h.adminUserService.ToggleUserStatus(userID, adminID); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusOK, "وضعیت کاربر با موفقیت تغییر کرد", nil)
}

// ChangeUserRole godoc
// @Summary Change user role (Admin)
// @Tags admin-users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param request body object true "Role data: {role: ADMIN|USER}"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/users/{id}/change-role [put]
func (h *AdminHandler) ChangeUserRole(c *gin.Context) {
	adminID, _ := uuid.Parse(c.GetString("userID"))

	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه کاربر نامعتبر است")
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً نقش کاربر را مشخص کنید", err.Error())
		return
	}

	if err := h.adminUserService.ChangeUserRole(userID, req.Role, adminID); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusOK, "نقش کاربر با موفقیت تغییر کرد", nil)
}
