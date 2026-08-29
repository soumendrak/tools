default: dev

dev:
    pnpm dev -p 4000

build:
    pnpm build

start:
    pnpm start

lint:
    pnpm lint

skin-tools:
    pnpm skin:tools

check-tools:
    pnpm check:tools

deploy:
    pnpm deploy:cf
