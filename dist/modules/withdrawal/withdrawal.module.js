"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const schedule_1 = require("@nestjs/schedule");
const withdrawal_service_1 = require("./withdrawal.service");
const withdrawal_job_manager_service_1 = require("./withdrawal-job-manager.service");
const withdrawal_controller_1 = require("./withdrawal.controller");
const ezpay_be_client_service_1 = require("../notifiction/ezpay-be-client.service");
const redis_service_1 = require("../../common/services/redis.service");
const hcbox_module_1 = require("../hcbox/hcbox.module");
const device_module_1 = require("../device/device.module");
const bank_module_1 = require("../bank/bank.module");
const axios_1 = require("@nestjs/axios");
const window_app_module_1 = require("../window-app/window-app.module");
let WithdrawalModule = class WithdrawalModule {
};
exports.WithdrawalModule = WithdrawalModule;
exports.WithdrawalModule = WithdrawalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({
                name: 'wda-request',
            }),
            schedule_1.ScheduleModule,
            hcbox_module_1.HcBoxModule,
            (0, common_1.forwardRef)(() => device_module_1.DeviceModule),
            bank_module_1.BankModule,
            axios_1.HttpModule,
            window_app_module_1.WindowAppModule
        ],
        controllers: [withdrawal_controller_1.WithdrawalController],
        providers: [
            withdrawal_service_1.WithdrawalService,
            withdrawal_job_manager_service_1.WithdrawalJobManagerService,
            ezpay_be_client_service_1.EzpayBeClientService,
            redis_service_1.RedisService,
        ],
        exports: [withdrawal_service_1.WithdrawalService],
    })
], WithdrawalModule);
//# sourceMappingURL=withdrawal.module.js.map