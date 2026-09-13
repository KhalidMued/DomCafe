FROM golang:1.25.13-alpine@sha256:1e0126852075c9c60731c8ba49088448b91f63e2aed97ca9d1a9791622a05946 AS gosu-builder

RUN apk add --no-cache git \
    && git clone --branch 1.19 --depth 1 https://github.com/tianon/gosu.git /src/gosu
WORKDIR /src/gosu
RUN go get golang.org/x/sys@v0.44.0 \
    && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -buildvcs=true -o /gosu .

FROM postgres:16-alpine@sha256:cf78e76683b9ca8c5733cbbdce6c9262b45b6767934dd0a95e671f9a0fc20685
RUN apk upgrade --no-cache
COPY --from=gosu-builder /gosu /usr/local/bin/gosu
RUN gosu --version && gosu nobody true
