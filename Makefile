
.PHONY: restart

restart:
	lsof -ti:8080 | xargs kill -9
	npm run serve
