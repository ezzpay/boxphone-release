"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankModule = void 0;
const common_1 = require("@nestjs/common");
const bank_service_1 = require("./bank.service");
const acb_service_1 = require("./acb.service");
const pg_service_1 = require("./pg.service");
const hdbank_service_1 = require("./hdbank.service");
const bank_controller_1 = require("./bank.controller");
const hcbox_module_1 = require("../hcbox/hcbox.module");
const device_module_1 = require("../device/device.module");
const websocket_module_1 = require("../../common/modules/websocket/websocket.module");
const session_management_service_1 = require("./session-management.service");
const session_refresh_scheduler_1 = require("./session-refresh.scheduler");
const redis_service_1 = require("../../common/services/redis.service");
const ocr_module_1 = require("../ocr/ocr.module");
const notification_module_1 = require("../notifiction/notification.module");
const vietcombank_service_1 = require("./vietcombank.service");
let BankModule = class BankModule {
};
exports.BankModule = BankModule;
exports.BankModule = BankModule = __decorate([
    (0, common_1.Module)({
        imports: [
            hcbox_module_1.HcBoxModule,
            (0, common_1.forwardRef)(() => device_module_1.DeviceModule),
            websocket_module_1.WebSocketModule,
            ocr_module_1.OCRModule,
            notification_module_1.NotificationModule
        ],
        controllers: [bank_controller_1.BankController],
        providers: [
            bank_service_1.BankService,
            acb_service_1.AcbService,
            pg_service_1.PgService,
            hdbank_service_1.HdBankService,
            vietcombank_service_1.VietcombankService,
            session_management_service_1.SessionManagementService,
            session_refresh_scheduler_1.SessionRefreshScheduler,
            redis_service_1.RedisService,
        ],
        exports: [bank_service_1.BankService],
    })
], BankModule);
//# sourceMappingURL=bank.module.js.map