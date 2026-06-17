---
name: tsx/esbuild @Inject requirement
description: NestJS DI fails silently for new files compiled by tsx because esbuild does not emit design:paramtypes metadata. Fix with explicit @Inject(Token).
---

## Rule
Every NestJS constructor parameter in files compiled via `tsx watch` (esbuild-based) MUST use `@Inject(Token)` explicitly. Without it, NestJS silently injects `undefined` at runtime even though startup succeeds without errors.

**Why:** esbuild transpiles TypeScript but does not emit `reflect-metadata` `design:paramtypes` even when `emitDecoratorMetadata: true` is set in tsconfig. NestJS relies on this metadata to resolve constructor injection tokens. Old files in the tsx cache may work because they were pre-compiled with a different toolchain, but all newly created `.ts` files will fail.

**How to apply:**
- All new `@Injectable()` services: `constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}`
- All new `@Controller()` classes: `constructor(@Inject(XxxService) private readonly service: XxxService) {}`
- Add `Inject` to the `@nestjs/common` import line
- AuthV1Controller bypasses DI entirely for auth — logic is inline using `createRequire` for jwt/bcrypt
