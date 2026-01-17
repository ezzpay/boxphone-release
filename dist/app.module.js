"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = require("@nestjs/axios");
const withdrawal_module_1 = require("./modules/withdrawal/withdrawal.module");
const hcbox_module_1 = require("./modules/hcbox/hcbox.module");
const device_module_1 = require("./modules/device/device.module");
const redis_service_1 = require("./common/services/redis.service");
const websocket_module_1 = require("./common/modules/websocket/websocket.module");
const config_1 = require("./common/constants/config");
const bank_module_1 = require("./modules/bank/bank.module");
const ocr_module_1 = require("./modules/ocr/ocr.module");
const notification_module_1 = require("./modules/notifiction/notification.module");
const redis_lock_module_1 = require("./modules/redis-lock/redis-lock.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.forRoot({
                redis: {
                    host: config_1.config.redis.host,
                    port: config_1.config.redis.port,
                    db: config_1.config.redis.db,
                    password: config_1.config.redis.password,
                },
                defaultJobOptions: {
                    removeOnComplete: 10,
                    removeOnFail: 50,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            }),
            schedule_1.ScheduleModule.forRoot(),
            axios_1.HttpModule,
            withdrawal_module_1.WithdrawalModule,
            hcbox_module_1.HcBoxModule,
            device_module_1.DeviceModule,
            websocket_module_1.WebSocketModule,
            bank_module_1.BankModule,
            ocr_module_1.OCRModule,
            notification_module_1.NotificationModule,
            redis_lock_module_1.RedisLockModule
        ],
        providers: [
            redis_service_1.RedisService,
        ],
        exports: [redis_service_1.RedisService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map