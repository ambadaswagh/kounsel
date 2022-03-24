.DEFAULT: build

COMMIT := $(shell git rev-parse --verify --short HEAD)

build:
	npm install
	npm install -g firebase-tools
	./node_modules/.bin/ng build --prod

test:
	npm test

update:
	git pull
	git submodule update --recursive --remote
