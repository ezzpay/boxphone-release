"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const config_1 = require("./common/constants/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {});
    const logger = new common_1.Logger('Bootstrap');
    const viewsPath = process.env.NODE_ENV === 'production'
        ? (0, path_1.join)(__dirname, 'views')
        : (0, path_1.join)(process.cwd(), 'src', 'views');
    app.setBaseViewsDir(viewsPath);
    app.setViewEngine('ejs');
    logger.log(`Views directory: ${viewsPath}`);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('EzPay Auto API')
        .setDescription('Automated withdrawal processing service with HC BOX integration')
        .setVersion('1.0')
        .addTag('bank', 'Bank operations')
        .addTag('withdrawal', 'Withdrawal processing')
        .addTag('device', 'Device management')
        .addTag('hcbox', 'HC Box integration')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 3002;
    logger.log(`📚 Swagger documentation available at: http://localhost:${port}/docs`);
    await app.listen(port);
    logger.log(`🚀 EzPay Auto is running on: http://localhost:${port}`);
    logger.log(`📊 Withdrawal processing started by ${config_1.config.boxType} box`);
    logger.log(`🌐 Device management: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map