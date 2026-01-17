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
exports.HCWebSocketService = void 0;
const common_1 = require("@nestjs/common");
const WebSocket = require("ws");
const keyboard_1 = require("../../constants/keyboard");
const time_1 = require("../../utils/time");
const lodash_1 = require("lodash");
let HCWebSocketService = class HCWebSocketService {
    constructor() {
        this.logger = new common_1.Logger('HCWebSocketService');
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.requestQueue = [];
        this.pendingRequests = new Map();
        this.isConnected = false;
        this.isProcessingRequest = false;
        this.wsUrl = 'ws://127.0.0.1:26608';
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
                this.logger.log(`Connecting to HC BOX WebSocket: ${this.wsUrl}`);
                this.ws = new WebSocket(this.wsUrl);
                this.ws.on('open', () => {
                    this.logger.log('HC BOX WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.processRequestQueue();
                    resolve();
                });
                this.ws.on('message', (data) => {
                    try {
                        const response = JSON.parse(data.toString());
                        this.handleMessage(response);
                    }
                    catch (error) {
                        this.logger.error(`Error parsing WebSocket message: ${error.message}`);
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
                    this.logger.warn('HC BOX WebSocket closed');
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
            if (response.StatusCode === 200) {
                firstHandler.resolve(response.result);
            }
            else {
                firstHandler.reject(new Error(`HC BOX error: ${response.StatusCode}`));
            }
        }
        else {
            this.logger.warn(`Received response but no pending requests: ${JSON.stringify(response)}`);
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
                this.ws.send(JSON.stringify(request));
            }
            catch (error) {
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
        return Array.isArray(response) ? response : [];
    }
    async click(deviceIds, x, y, duration = 0.2) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            action: 'click',
            comm: {
                deviceIds: deviceIdsStr,
                x,
                y,
                duration,
            },
        });
    }
    async swipe(deviceIds, options) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            action: 'swipe',
            comm: {
                deviceIds: deviceIdsStr,
                ...options
            },
        });
    }
    async captureScreen(deviceId, options) {
        return this.sendRequest({
            action: 'screen',
            comm: {
                deviceIds: deviceId,
                ...(0, lodash_1.omit)(options, 'folderPath'),
                filePath: options.folderPath,
            },
        });
    }
    async home(deviceIds) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            action: 'home',
            comm: {
                deviceIds: deviceIdsStr,
            },
        });
    }
    async launchApp(deviceIds, bundleId) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            action: 'launchApp',
            comm: {
                deviceIds: deviceIdsStr,
                content: bundleId,
            },
        });
    }
    async killApp(deviceIds, bundleId) {
        const deviceIdsStr = Array.isArray(deviceIds) ? deviceIds.join(',') : deviceIds;
        return this.sendRequest({
            action: 'killApp',
            comm: {
                deviceIds: deviceIdsStr,
                content: bundleId,
            },
        });
    }
    isNumber(char) {
        return /^[0-9]$/.test(char);
    }
    isLetter(char) {
        return /^[a-zA-Z]$/.test(char);
    }
    isSpecialCharInNumberMode(char) {
        const specialChars = ['@', '!'];
        return specialChars.includes(char);
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
        this.logger.log(`Pressing return key on device ${deviceId} at coordinates (${x}, ${y})`);
        await this.click(deviceId, x, y, 0.2);
        await (0, time_1.sleep)(500);
        this.logger.log(`Return key pressed successfully on device ${deviceId}`);
    }
    async inputText(deviceIds, text) {
        if (!text || text.length === 0) {
            throw new Error('Password cannot be empty');
        }
        let currentMode = 'letter';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charLower = char.toLowerCase();
            const isUppercase = char !== charLower && this.isLetter(char);
            const keyToLookup = this.isSpecialCharInNumberMode(char) ? char : charLower;
            const keyCoords = keyboard_1.KEYBOARD_LAYOUT[keyToLookup];
            if (!keyCoords) {
                this.logger.warn(`Character '${char}' not found in keyboard layout. Skipping...`);
                continue;
            }
            let requiredMode = null;
            if (this.isNumber(charLower)) {
                requiredMode = 'number';
            }
            else if (this.isLetter(charLower)) {
                requiredMode = 'letter';
            }
            else if (this.isSpecialCharInNumberMode(char)) {
                requiredMode = 'number';
            }
            if (requiredMode && currentMode !== requiredMode) {
                this.logger.debug(`Switching keyboard to ${requiredMode} mode for character '${char}'`);
                await this.switchKeyboardMode(deviceIds);
                currentMode = requiredMode;
            }
            if (isUppercase && currentMode === 'letter') {
                this.logger.debug(`Pressing shift key for uppercase letter '${char}'`);
                await this.pressShiftKey(deviceIds);
            }
            this.logger.debug(`Clicking key '${keyToLookup}'${isUppercase ? ' (uppercase)' : ''} at (${keyCoords.x}, ${keyCoords.y})`);
            await this.click(deviceIds, keyCoords.x, keyCoords.y, 0.15);
            await (0, time_1.sleep)(200);
        }
        this.logger.log(`Text input completed on device ${deviceIds}`);
    }
    async inputNumpadNumber(deviceIds, value) {
        if (!value || value.length === 0) {
            throw new Error('value cannot be empty');
        }
        for (let i = 0; i < value.length; i++) {
            const digit = value[i];
            const coordinates = keyboard_1.NUMPAD_LAYOUT[digit];
            await this.click(deviceIds, coordinates.x, coordinates.y, 0.15);
            this.logger.debug(`Clicking key '${digit}' at (${coordinates.x}, ${coordinates.y})`);
            await (0, time_1.sleep)(200);
        }
    }
    async transferFile(deviceIds, filePath, fileType = 1) {
        return Promise.resolve(null);
    }
    isConnectedStatus() {
        return this.isConnected;
    }
};
exports.HCWebSocketService = HCWebSocketService;
exports.HCWebSocketService = HCWebSocketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], HCWebSocketService);
//# sourceMappingURL=hc-websocket.service.js.map