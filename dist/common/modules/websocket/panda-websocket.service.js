"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PandaWebSocketService = void 0;
const common_1 = require("@nestjs/common");
const WebSocket = require("ws");
const lodash_1 = require("lodash");
const time_1 = require("../../utils/time");
const keyboard_1 = require("../../constants/keyboard");
const telegram_service_1 = require("../../../modules/notifiction/telegram.service");
let PandaWebSocketService = class PandaWebSocketService {
    constructor(telegramService) {
        this.telegramService = telegramService;
        this.logger = new common_1.Logger('PandaWebSocketService');
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.requestQueue = [];
        this.pendingRequests = new Map();
        this.isConnected = false;
        this.isProcessingRequest = false;
        this.wsUrl = 'ws://127.0.0.1:33333';
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.logger.log(`Connecting to Panda BOX WebSocket: ${this.wsUrl}`);
                this.ws = new WebSocket(this.wsUrl);
                this.ws.on('open', () => {
                    this.logger.log('Panda BOX WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.processRequestQueue();
                    resolve();
                });
                this.ws.on('message', (data) => {
                    try {
                        const messageStr = data.toString();
                        const response = JSON.parse(messageStr);
                        this.handleMessage(response);
                    }
                    catch (error) {
                        this.logger.error(`Error parsing WebSocket message: ${error.message}`, error.stack);
                        this.logger.error(`Raw message was: ${data.toString()}`);
                    }
                });
                this.ws.on('error', (error) => {
                    this.logger.error(`WebSocket error: ${error.message}`);
                    this.isConnected = false;
                    if (this.reconnectAttempts === 0) {
                        reject(error);
                    }
                });
                this.ws.on('close', () => {
                    this.logger.warn('Panda BOX WebSocket closed');
                    this.isConnected = false;
                    this.scheduleReconnect();
                });
            }
            catch (error) {
                this.logger.error(`Error creating WebSocket connection: ${error.message}`);
                reject(error);
            }
        });
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnection attempts reached');
            this.telegramService
                .sendMessage({
                text: '🆘🆘🆘 Connection Error'
                    + `\n\n<b>Kết nối vào boxphone software thất bại.</b>`
                    + `\n<b>Max retry:</b> ${this.maxReconnectAttempts}`
                    + `\n<b>Current retry:</b> ${this.reconnectAttempts}`
                    + `\n<b>Retry delay:</b> ${this.reconnectDelay}ms`,
                options: {
                    parseMode: 'HTML'
                }
            });
            return;
        }
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        this.logger.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        setTimeout(() => {
            this.connect().catch((error) => {
                this.logger.error(`Reconnection failed: ${error.message}`);
            });
        }, delay);
    }
    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
    handleMessage(response) {
        if (this.pendingRequests.size > 0) {
            const [firstKey, firstHandler] = this.pendingRequests.entries().next().value;
            this.pendingRequests.delete(firstKey);
            if (response.code === 10000) {
                firstHandler.resolve(response.data);
            }
            else {
                const errorMessage = response.message || `Panda BOX error: ${response.code}`;
                firstHandler.reject(new Error(errorMessage));
            }
        }
        else {
            const isDeviceListResponse = Array.isArray(response.data) &&
                response.data.length > 0 &&
                response.data[0]?.serial !== undefined;
            if (isDeviceListResponse && response.code === 10000) {
                const deviceList = response.data;
                this.logger.debug(`Received unsolicited device list update (no pending requests): ${deviceList.length} device(s)`);
            }
            else {
                this.logger.warn(`Received response but no pending requests: ${JSON.stringify(response)}`);
            }
        }
    }
    async processRequestQueue() {
        if (this.isProcessingRequest || this.requestQueue.length === 0) {
            return;
        }
        if (!this.isConnected || !this.ws) {
            return;
        }
        this.isProcessingRequest = true;
        const { request, resolve, reject, timeout } = this.requestQueue.shift();
        try {
            const result = await this._sendRequestOnce(request, timeout);
            resolve(result);
        }
        catch (error) {
            reject(error);
        }
        finally {
            this.isProcessingRequest = false;
            if (this.requestQueue.length > 0) {
                setImmediate(() => this.processRequestQueue());
            }
        }
    }
    async _sendRequestOnce(request, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            this.pendingRequests.set(requestId, { resolve, reject });
            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('WebSocket request timeout'));
            }, timeout);
            const originalResolve = resolve;
            const originalReject = reject;
            resolve = (value) => {
                clearTimeout(timeoutId);
                originalResolve(value);
            };
            reject = (error) => {
                clearTimeout(timeoutId);
                originalReject(error);
            };
            this.pendingRequests.set(requestId, { resolve, reject });
            try {
                const requestStr = JSON.stringify(request);
                this.ws.send(requestStr);
            }
            catch (error) {
                this.logger.error(`Error sending WebSocket request: ${error.message}`, error.stack);
                this.pendingRequests.delete(requestId);
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }
    async sendRequest(request, timeout = 30000) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ request, resolve, reject, timeout });
            this.processRequestQueue();
        });
    }
    async listDevices() {
        const response = await this.sendRequest({ action: 'list' });
        const devices = response.map((device) => ({
            ...device,
            udid: device.serial,
        }));
        if (devices.length <= 0) {
            this.logger.error('No devices found!');
        }
        return devices;
    }
    async click(deviceIds, x, y, duration = 0.2) {
        return this.sendRequest({
            "action": "pointerEvent",
            "devices": Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds,
            "data": {
                "type": "10",
                "x": (0, lodash_1.toString)(x),
                "y": (0, lodash_1.toString)(y),
            }
        });
    }
    async swipe(deviceIds, options) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            "action": "pointerEvent",
            "devices": deviceIdsStr,
            "data": options
        });
    }
    async captureScreen(deviceId, options) {
        return this.sendRequest({
            "action": "screenFile",
            "devices": deviceId,
            "data": {
                savePath: options.folderPath
            }
        });
    }
    async home(deviceIds) {
        return this.sendRequest({
            "action": "pushEvent",
            "devices": deviceIds,
            "data": {
                "type": "2"
            }
        });
    }
    async launchApp(deviceIds, bundleId) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            "action": "startApp",
            "devices": deviceIdsStr,
            "data": {
                "app": bundleId
            }
        });
    }
    async killApp(deviceIds, bundleId) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            "action": "stopApp",
            "devices": deviceIdsStr,
            "data": {
                "app": bundleId
            }
        });
    }
    async switchKeyboardMode(deviceIds) {
        const { x, y } = keyboard_1.COMMON_COORDINATES.KEYBOARD_SWITCH;
        this.logger.log(`Switching keyboard mode on device ${deviceIds} at coordinates (${x}, ${y})`);
        await this.click(deviceIds, x, y, 0.2);
        await (0, time_1.sleep)(500);
        this.logger.log(`Keyboard mode switched successfully on device ${deviceIds}`);
    }
    async pressShiftKey(deviceIds) {
        const { x, y } = keyboard_1.COMMON_COORDINATES.SHIFT_KEY;
        this.logger.debug(`Pressing shift key on device ${deviceIds} at coordinates (${x}, ${y})`);
        await this.click(deviceIds, x, y, 0.2);
        await (0, time_1.sleep)(200);
        this.logger.debug(`Shift key pressed successfully on device ${deviceIds}`);
    }
    async pressReturnKey(deviceId) {
        const { x, y } = keyboard_1.COMMON_COORDINATES.RETURN_KEY;
        ;
        await this.click(deviceId, x, y, 0.2);
        await (0, time_1.sleep)(500);
    }
    async inputText(deviceIds, text) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            "action": "inputText",
            "devices": deviceIdsStr,
            "data": {
                "content": text
            }
        });
    }
    async inputNumpadNumber(deviceIds, value) {
        if (!value || value.length === 0) {
            throw new Error('value cannot be empty');
        }
        for (let i = 0; i < value.length; i++) {
            const digit = value[i];
            const coordinates = keyboard_1.NUMPAD_LAYOUT[digit];
            await this.click(deviceIds, coordinates.x, coordinates.y);
            this.logger.debug(`Clicking key '${digit}' at (${coordinates.x}, ${coordinates.y})`);
            await (0, time_1.sleep)(200);
        }
    }
    async transferFile(deviceIds, filePath, fileType = 1) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        this.logger.log(`Transferring file ${filePath} to device(s) ${deviceIdsStr} with fileType ${fileType}`);
        return this.sendRequest({
            "action": "uploadFile",
            "devices": deviceIdsStr,
            "data": {
                "filePath": filePath,
                "fileType": fileType
            }
        });
    }
    isConnectedStatus() {
        return this.isConnected;
    }
};
exports.PandaWebSocketService = PandaWebSocketService;
exports.PandaWebSocketService = PandaWebSocketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService])
], PandaWebSocketService);
//# sourceMappingURL=panda-websocket.service.js.map