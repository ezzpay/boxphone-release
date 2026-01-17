"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HcBoxModule = void 0;
const common_1 = require("@nestjs/common");
const hcbox_service_1 = require("./hcbox.service");
let HcBoxModule = class HcBoxModule {
};
exports.HcBoxModule = HcBoxModule;
exports.HcBoxModule = HcBoxModule = __decorate([
    (0, common_1.Module)({
        providers: [hcbox_service_1.HcBoxService],
        exports: [hcbox_service_1.HcBoxService],
    })
], HcBoxModule);
//# sourceMappingURL=hcbox.module.js.map