FROM golang:1.24-bookworm AS builder

WORKDIR /src

RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o /out/server ./cmd/server

FROM debian:bookworm-slim AS runtime

WORKDIR /app/cmd/server

RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	libsqlite3-0 \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=builder /out/server ./server
COPY --from=builder /src/internal /app/internal
COPY entrypoint.sh /app/cmd/server/entrypoint.sh

RUN mkdir -p /data/uploads /app/cmd/server/uploads
RUN chmod +x /app/cmd/server/entrypoint.sh

EXPOSE 8081

ENTRYPOINT ["./entrypoint.sh"]
