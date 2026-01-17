"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceModule = void 0;
const common_1 = require("@nestjs/common");
const device_controller_1 = require("./device.controller");
const device_service_1 = require("./device.service");
const device_lock_service_1 = require("./device-lock.service");
const hcbox_module_1 = require("../hcbox/hcbox.module");
const redis_service_1 = require("../../common/services/redis.service");
const bank_module_1 = require("../bank/bank.module");
let DeviceModule = class DeviceModule {
};
exports.DeviceModule = DeviceModule;
exports.DeviceModule = DeviceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            hcbox_module_1.HcBoxModule,
            (0, common_1.forwardRef)(() => bank_module_1.BankModule),
        ],
        controllers: [device_controller_1.DeviceController],
        providers: [
            device_service_1.DeviceService,
            device_lock_service_1.DeviceLockService,
            redis_service_1.RedisService,
        ],
        exports: [
            device_service_1.DeviceService,
            device_lock_service_1.DeviceLockService,
        ],
    })
], DeviceModule);
//# sourceMappingURL=device.module.js.map