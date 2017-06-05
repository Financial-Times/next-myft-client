node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

unit-test:
	@echo "Testing…"
	karma start --single-run

test: verify unit-test

test-dev:
	@echo "Testing…"
	karma start --browsers Chrome
