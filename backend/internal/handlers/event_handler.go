package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/services"
	"ticket-reservation-system/pkg/utils"
)

type EventHandler struct {
	eventService *services.EventService
}

func NewEventHandler(eventService *services.EventService) *EventHandler {
	return &EventHandler{eventService: eventService}
}

// GetActiveEvents godoc
// @Summary Get list of active events
// @Tags events
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/events [get]
func (h *EventHandler) GetActiveEvents(c *gin.Context) {
	events, err := h.eventService.GetActiveEvents()
	if err != nil {
		utils.InternalError(c, "خطا در دریافت لیست رویدادها")
		return
	}

	utils.Success(c, http.StatusOK, events)
}

// GetAllEvents godoc
// @Summary Get all events for management (Admin)
// @Tags admin-events
// @Produce json
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/events [get]
func (h *EventHandler) GetAllEvents(c *gin.Context) {
	events, err := h.eventService.GetAllEvents()
	if err != nil {
		utils.InternalError(c, "خطا در دریافت فهرست کامل رویدادها")
		return
	}

	utils.Success(c, http.StatusOK, events)
}

// GetEventByID godoc
// @Summary Get event details
// @Tags events
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/events/{id} [get]
func (h *EventHandler) GetEventByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه رویداد نامعتبر است")
		return
	}

	event, err := h.eventService.GetEventByID(id)
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, event)
}

// GetSeatMap godoc
// @Summary Get seat map for an event
// @Tags events
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/events/{id}/seats [get]
func (h *EventHandler) GetSeatMap(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه رویداد نامعتبر است")
		return
	}

	userID, _ := uuid.Parse(c.GetString("userID"))

	seatMap, err := h.eventService.GetSeatMap(eventID, userID)
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}

	utils.Success(c, http.StatusOK, seatMap)
}

// Admin Handlers

// CreateEvent godoc
// @Summary Create a new event (Admin)
// @Tags admin-events
// @Accept json
// @Produce json
// @Param request body models.CreateEventRequest true "Event data"
// @Success 201 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/events [post]
func (h *EventHandler) CreateEvent(c *gin.Context) {
	adminID, _ := uuid.Parse(c.GetString("userID"))

	var req models.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً تمام فیلدهای ضروری را پر کنید", err.Error())
		return
	}

	event, err := h.eventService.CreateEvent(&req, adminID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusCreated, "رویداد با موفقیت ایجاد شد", event)
}

// UpdateEvent godoc
// @Summary Update an event (Admin)
// @Tags admin-events
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param request body models.UpdateEventRequest true "Event update data"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/events/{id} [put]
func (h *EventHandler) UpdateEvent(c *gin.Context) {
	adminID, _ := uuid.Parse(c.GetString("userID"))

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه رویداد نامعتبر است")
		return
	}

	var req models.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationError(c, "لطفاً فیلدها را به درستی پر کنید", err.Error())
		return
	}

	event, err := h.eventService.UpdateEvent(eventID, &req, adminID)
	if err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusOK, "رویداد با موفقیت به‌روزرسانی شد", event)
}

// DeleteEvent godoc
// @Summary Delete an event (Admin)
// @Tags admin-events
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} utils.APIResponse
// @Security BearerAuth
// @Router /api/v1/admin/events/{id} [delete]
func (h *EventHandler) DeleteEvent(c *gin.Context) {
	adminID, _ := uuid.Parse(c.GetString("userID"))

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.BadRequest(c, "شناسه رویداد نامعتبر است")
		return
	}

	if err := h.eventService.DeleteEvent(eventID, adminID); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	utils.SuccessMessage(c, http.StatusOK, "رویداد با موفقیت حذف شد", nil)
}
