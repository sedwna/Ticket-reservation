FROM golang:1.26-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

# Download dependencies in a cacheable Docker layer.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go test ./...
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.22

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Tehran

COPY --from=builder /server /usr/local/bin/server

EXPOSE 8080

CMD ["server"]
