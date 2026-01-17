"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
const ezpay_be_client_service_1 = require("./ezpay-be-client.service");
const axios_1 = require("@nestjs/axios");
const telegram_service_1 = require("./telegram.service");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
        ],
        providers: [
            notification_service_1.NotificationService,
            ezpay_be_client_service_1.EzpayBeClientService,
            telegram_service_1.TelegramService
        ],
        exports: [
            notification_service_1.NotificationService,
            telegram_service_1.TelegramService
        ],
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map