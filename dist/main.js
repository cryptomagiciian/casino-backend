"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const crypto = require("crypto");
const app_module_1 = require("./app.module");
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = crypto;
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        console.log(`🌐 Manual CORS middleware - Origin: ${origin}`);
        const allowedOrigins = [
            'https://0357ec48-105d-4242-8382-10eceaae5da6.lovableproject.com',
            'https://id-preview--0357ec48-105d-4242-8382-10eceaae5da6.lovable.app',
            'http://localhost:3000',
            'http://localhost:3001'
        ];
        const isLovable = origin && (origin.includes('.lovable.app') || origin.includes('.lovableproject.com'));
        const isAllowed = origin && (allowedOrigins.includes(origin) || isLovable);
        if (isAllowed) {
            res.header('Access-Control-Allow-Origin', origin);
            console.log(`✅ Manual CORS - Allowed origin: ${origin}`);
        }
        else if (!origin) {
            res.header('Access-Control-Allow-Origin', '*');
            console.log('✅ Manual CORS - Allowed no origin');
        }
        else {
            console.log(`❌ Manual CORS - Blocked origin: ${origin}`);
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    });
    const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
    const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
    const allowedOriginsList = [
        'https://dexinocasino.com',
        'https://www.dexinocasino.com',
        'http://localhost:3000',
        'http://localhost:3001',
        ...allowedOrigins
    ];
    app.enableCors({
        origin: (origin, callback) => {
            console.log(`🔍 CORS Request from origin: ${origin}`);
            if (!origin) {
                console.log('✅ Allowing request with no origin');
                return callback(null, true);
            }
            const isInExplicitList = allowedOriginsList.includes(origin);
            const isLovable = origin.includes('.lovable.app') || origin.includes('.lovableproject.com');
            const isCustomDomain = origin.includes('dexinocasino.com');
            const isAllowed = isInExplicitList || isLovable || isCustomDomain;
            console.log(`🔍 CORS Check - Origin: ${origin}`);
            console.log(`   - In explicit list: ${isInExplicitList}`);
            console.log(`   - Is Lovable: ${isLovable}`);
            console.log(`   - Is custom domain: ${isCustomDomain}`);
            console.log(`   - Final decision: ${isAllowed ? 'ALLOW' : 'BLOCK'}`);
            if (isAllowed) {
                callback(null, true);
            }
            else {
                console.warn(`❌ CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
        preflightContinue: false,
        optionsSuccessStatus: 204
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const apiPrefix = configService.get('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Casino API')
        .setDescription('Production-grade mini-casino backend with multi-asset balances and provably fair games')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = configService.get('PORT', 3000);
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Application is running on: http://0.0.0.0:${port}/${apiPrefix}`);
    console.log(`📚 Swagger documentation: http://0.0.0.0:${port}/docs`);
}
bootstrap().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map