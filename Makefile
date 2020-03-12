node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

unit-test-node:
	mocha test/node --recursive

unit-test-browser:
	karma start --single-run

unit-test: unit-test-node unit-test-browser

test: verify unit-test
	node test.js

test-dev:
	@echo "Testing…"
	karma start --browsers Chrome
