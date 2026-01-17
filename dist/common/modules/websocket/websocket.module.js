"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketModule = void 0;
const common_1 = require("@nestjs/common");
const hc_websocket_service_1 = require("./hc-websocket.service");
const panda_websocket_service_1 = require("./panda-websocket.service");
const websocket_1 = require("./constants/websocket");
const config_1 = require("../../constants/config");
let WebSocketModule = class WebSocketModule {
};
exports.WebSocketModule = WebSocketModule;
exports.WebSocketModule = WebSocketModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: websocket_1.WEBSOCKET_SERVICE,
                useClass: config_1.config.boxType === 'PANDA' ? panda_websocket_service_1.PandaWebSocketService : hc_websocket_service_1.HCWebSocketService,
            }
        ],
        exports: [websocket_1.WEBSOCKET_SERVICE],
    })
], WebSocketModule);
//# sourceMappingURL=websocket.module.js.map