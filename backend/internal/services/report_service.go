package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/internal/repository"
)

type ReportService struct {
	eventRepo       *repository.EventRepository
	reservationRepo *repository.ReservationRepository
	seatRepo        *repository.SeatRepository
	userRepo        *repository.UserRepository
}

func NewReportService(eventRepo *repository.EventRepository, reservationRepo *repository.ReservationRepository,
	seatRepo *repository.SeatRepository, userRepo *repository.UserRepository) *ReportService {
	return &ReportService{
		eventRepo:       eventRepo,
		reservationRepo: reservationRepo,
		seatRepo:        seatRepo,
		userRepo:        userRepo,
	}
}

type PublicStats struct {
	ActiveEvents   int64 `json:"active_events"`
	TotalSeats     int64 `json:"total_seats"`
	TotalUsers     int64 `json:"total_users"`
}

func (s *ReportService) GetPublicStats() (*PublicStats, error) {
	activeEvents, _ := s.eventRepo.CountActive()
	totalUsers, _ := s.userRepo.Count()

	var totalSeats int64
	events, _ := s.eventRepo.FindAllActive()
	for _, e := range events {
		totalSeats += int64(e.TotalCapacity)
	}

	return &PublicStats{
		ActiveEvents: activeEvents,
		TotalSeats:   totalSeats,
		TotalUsers:   totalUsers,
	}, nil
}

type DashboardStats struct {
	ActiveEvents   int64 `json:"active_events"`
	TodayReservations int64 `json:"today_reservations"`
	TotalUsers     int64 `json:"total_users"`
	WeeklyEvents   int64 `json:"weekly_events"`
	ReservationTrend []TrendPoint `json:"reservation_trend"`
	RecentReservations []models.ReservationResponse `json:"recent_reservations"`
}

type TrendPoint struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type EventReport struct {
	EventID       uuid.UUID `json:"event_id"`
	EventTitle    string    `json:"event_title"`
	EventDate     string    `json:"event_date"`
	TotalCapacity int       `json:"total_capacity"`
	ReservedCount int64     `json:"reserved_count"`
	AvailableCount int64    `json:"available_count"`
	OccupancyRate float64   `json:"occupancy_rate"`
	Reservations  []models.ReservationResponse `json:"reservations"`
}

type OccupancyData struct {
	Labels []string `json:"labels"`
	Data   []int64  `json:"data"`
}

func (s *ReportService) GetDashboardStats() (*DashboardStats, error) {
	activeEvents, _ := s.eventRepo.CountActive()
	todayReservations, _ := s.reservationRepo.CountToday()
	totalUsers, _ := s.userRepo.Count()
	weeklyEvents, _ := s.eventRepo.CountThisWeek()

	trend, _ := s.reservationRepo.GetReservationTrend(7)
	trendPoints := make([]TrendPoint, 0, len(trend))
	for _, t := range trend {
		date, _ := t["date"].(time.Time)
		count, _ := t["count"].(int64)
		trendPoints = append(trendPoints, TrendPoint{
			Date:  date.Format("2006-01-02"),
			Count: int(count),
		})
	}

	// Get recent reservations
	recentReservations, _ := s.reservationRepo.FindAll(map[string]interface{}{})
	recentResponses := make([]models.ReservationResponse, 0)
	limit := 10
	if len(recentReservations) < limit {
		limit = len(recentReservations)
	}
	for i := 0; i < limit; i++ {
		r := recentReservations[i]
		recentResponses = append(recentResponses, models.ReservationResponse{
			ID:           r.ID,
			EventTitle:   r.Event.Title,
			SeatLabel:    r.Seat.SeatLabel,
			UserFullName: r.User.FirstName + " " + r.User.LastName,
			ReservedAt:   r.ReservedAt.Format(time.RFC3339),
			Status:       r.Status,
		})
	}

	return &DashboardStats{
		ActiveEvents:      activeEvents,
		TodayReservations: todayReservations,
		TotalUsers:        totalUsers,
		WeeklyEvents:      weeklyEvents,
		ReservationTrend:  trendPoints,
		RecentReservations: recentResponses,
	}, nil
}

func (s *ReportService) GetEventReport(eventID uuid.UUID) (*EventReport, error) {
	event, err := s.eventRepo.FindByID(eventID)
	if err != nil {
		return nil, fmt.Errorf("event not found: %w", err)
	}

	reservedCount, _ := s.reservationRepo.CountByEvent(eventID)
	availableCount := int64(event.TotalCapacity) - reservedCount
	occupancyRate := float64(0)
	if event.TotalCapacity > 0 {
		occupancyRate = float64(reservedCount) / float64(event.TotalCapacity) * 100
	}

	reservations, _ := s.reservationRepo.FindByEventID(eventID)
	reservationResponses := make([]models.ReservationResponse, 0, len(reservations))
	for _, r := range reservations {
		reservationResponses = append(reservationResponses, toReservationResponseHelper(&r))
	}

	return &EventReport{
		EventID:        eventID,
		EventTitle:     event.Title,
		EventDate:      event.EventDate.Format("2006-01-02"),
		TotalCapacity:  event.TotalCapacity,
		ReservedCount:  reservedCount,
		AvailableCount: availableCount,
		OccupancyRate:  occupancyRate,
		Reservations:   reservationResponses,
	}, nil
}

func (s *ReportService) GetOccupancyData() (*OccupancyData, error) {
	events, err := s.eventRepo.FindAllActive()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch events: %w", err)
	}

	labels := make([]string, 0, len(events))
	data := make([]int64, 0, len(events))

	for _, event := range events {
		labels = append(labels, event.Title)
		count, _ := s.reservationRepo.CountByEvent(event.ID)
		data = append(data, count)
	}

	return &OccupancyData{
		Labels: labels,
		Data:   data,
	}, nil
}

// GenerateCSV generates CSV report data
func (s *ReportService) GenerateCSV(filters map[string]interface{}) ([]byte, error) {
	reservations, err := s.reservationRepo.FindAll(filters)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch reservations: %w", err)
	}

	// Create CSV headers
	headers := []string{
		"نام کاربر", "شماره دانشجویی", "عنوان رویداد", "تاریخ رویداد",
		"شماره صندلی", "ردیف", "تاریخ رزرو", "وضعیت",
	}

	data := make([][]string, 0, len(reservations)+1)
	data = append(data, headers)

	for _, r := range reservations {
		status := "فعال"
		if r.Status == "CANCELLED" {
			status = "لغو شده"
		}

		data = append(data, []string{
			r.User.FirstName + " " + r.User.LastName,
			r.User.StudentID,
			r.Event.Title,
			r.Event.EventDate.Format("2006-01-02"),
			r.Seat.SeatLabel,
			fmt.Sprintf("ردیف %d", r.Seat.RowNumber),
			r.ReservedAt.Format("2006-01-02 15:04"),
			status,
		})
	}

	return writeCSV(data)
}

func writeCSV(data [][]string) ([]byte, error) {
	b := make([]byte, 0)
	// UTF-8 BOM for Excel compatibility
	b = append(b, 0xEF, 0xBB, 0xBF)

	for _, row := range data {
		for i, cell := range row {
			b = append(b, []byte("\""+cell+"\"")...)
			if i < len(row)-1 {
				b = append(b, ',')
			}
		}
		b = append(b, '\n')
	}

	return b, nil
}

// Helper function to convert reservation to response (shared with reservation_service)
func toReservationResponseHelper(r *models.Reservation) models.ReservationResponse {
	resp := models.ReservationResponse{
		ID:         r.ID,
		UserID:     r.UserID,
		EventID:    r.EventID,
		SeatID:     r.SeatID,
		Status:     r.Status,
		ReservedAt: r.ReservedAt.Format(time.RFC3339),
	}

	if r.CancelledAt != nil {
		cancelled := r.CancelledAt.Format(time.RFC3339)
		resp.CancelledAt = &cancelled
	}

	if r.Event.Title != "" {
		resp.EventTitle = r.Event.Title
		resp.EventDate = r.Event.EventDate.Format("2006-01-02")
		resp.StartTime = r.Event.StartTime
		resp.EndTime = r.Event.EndTime
	}

	if r.Seat.SeatLabel != "" {
		resp.SeatLabel = r.Seat.SeatLabel
		resp.RowNumber = r.Seat.RowNumber
		resp.SeatNumber = r.Seat.SeatNumber
	}

	if r.User.FirstName != "" {
		resp.UserFullName = r.User.FirstName + " " + r.User.LastName
		resp.UserStudentID = r.User.StudentID
	}

	return resp
}
