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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bank_service_1 = require("./bank.service");
const config_1 = require("../../common/constants/config");
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
;
const promises_1 = require("fs/promises");
const image_preprocessing_service_1 = require("../ocr/services/image-preprocessing.service");
const ocr_service_1 = require("../ocr/services/ocr.service");
const string_1 = require("../../common/utils/string");
let BankController = class BankController {
    constructor(bankService, wsService, imagePreprocessingService, ocrService) {
        this.bankService = bankService;
        this.wsService = wsService;
        this.imagePreprocessingService = imagePreprocessingService;
        this.ocrService = ocrService;
        this.logger = new common_1.Logger('BankController');
    }
    getBankService(bankCode) {
        const service = this.bankService.getBankService(bankCode);
        if (!service) {
            throw new common_1.HttpException({
                success: false,
                error: `Bank service not found for bank code: ${bankCode}. Supported banks: ${this.bankService.getSupportedBanks().join(', ')}`,
            }, common_1.HttpStatus.BAD_REQUEST);
        }
        return service;
    }
    async getDevices(bankCode) {
        try {
            const devices = await this.wsService.listDevices();
            return {
                success: true,
                data: devices,
            };
        }
        catch (error) {
            this.logger.error(`Error getting devices: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testLaunchApp(bankCode, deviceId) {
        try {
            const service = this.getBankService(bankCode);
            this.logger.log(`Testing ${bankCode} app launch on device: ${deviceId}`);
            await service.launchApp(deviceId);
            return {
                success: true,
                message: `${bankCode} app launched successfully on device ${deviceId}`,
            };
        }
        catch (error) {
            this.logger.error(`Error testing ${bankCode} app launch: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testCaptureScreen(bankCode, deviceId, name, quality) {
        try {
            this.logger.log(`Testing screen capture on device: ${deviceId}`);
            const qualityValue = quality ? parseFloat(quality) : 0.5;
            const captureName = name || `test-screen-capture-${Date.now()}`;
            const base64Image = await this.wsService.captureScreen(deviceId, {
                quality: qualityValue,
                folderPath: `C:/boxscreen/${captureName}.png`,
            });
            return {
                success: true,
                message: `Screen captured successfully on device ${deviceId}`,
                data: {
                    base64Image,
                    imageLength: base64Image?.length ?? 0,
                },
            };
        }
        catch (error) {
            this.logger.error(`Error testing screen capture: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testClickAtCoordinates(bankCode, deviceId, x, y) {
        try {
            const xCoord = parseFloat(x);
            const yCoord = parseFloat(y);
            if (isNaN(xCoord) || isNaN(yCoord)) {
                return {
                    success: false,
                    error: 'Invalid coordinates. x and y must be numbers between 0 and 1',
                    example: `/api/bank/${bankCode}/test/click/{deviceId}?x=0.5&y=0.55`,
                };
            }
            this.logger.log(`Testing click at coordinates (${xCoord}, ${yCoord}) on device: ${deviceId}`);
            await this.wsService.click(deviceId, xCoord, yCoord);
            return {
                success: true,
                message: `Click completed successfully at coordinates (${xCoord}, ${yCoord}) on device ${deviceId}`,
                coordinates: { x: xCoord, y: yCoord },
            };
        }
        catch (error) {
            this.logger.error(`Error testing click at coordinates: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testSwipe(bankCode, deviceId, x, y, type, endX, endY, duration) {
        try {
            const isPandaFormat = config_1.config.boxType === 'PANDA';
            const isHCFormat = config_1.config.boxType === 'HC';
            if (isPandaFormat) {
                if (!type) {
                    return {
                        success: false,
                        error: 'For Panda format: type is required',
                        example: `/api/bank/${bankCode}/test/swipe/{deviceId}?type=0`,
                    };
                }
                const validTypes = ['0', '1', '2', '4', '5', '6', '7', '8', '9', '10'];
                if (!validTypes.includes(type)) {
                    return {
                        success: false,
                        error: `Invalid type. Type must be one of: 0 (按下/press), 1 (抬起/lift), 2 (移动/move), 4 (滚轮向上/scroll up), 5 (滚轮向下/scroll down), 6 (上滑/swipe up), 7 (下滑/swipe down), 8 (左滑/swipe left), 9 (右滑/swipe right), 10 (点击/click)`,
                        example: `/api/bank/${bankCode}/test/swipe/{deviceId}?type=0`,
                    };
                }
                const noCoordinateTypes = ['4', '5', '6', '7', '8', '9'];
                const isNoCoordinateType = noCoordinateTypes.includes(type);
                if (!isNoCoordinateType && (!x || !y)) {
                    return {
                        success: false,
                        error: `For Panda type ${type}: x and y are required`,
                        example: `/api/bank/${bankCode}/test/swipe/{deviceId}?x=50&y=30&type=${type}`,
                    };
                }
                const pandaOptions = {
                    type: type,
                };
                if (x && y) {
                    const xCoord = parseFloat(x);
                    const yCoord = parseFloat(y);
                    if (isNaN(xCoord) || isNaN(yCoord)) {
                        return {
                            success: false,
                            error: 'Invalid coordinates. x and y must be numbers between 0 and 100 for Panda',
                            example: `/api/bank/${bankCode}/test/swipe/{deviceId}?x=50&y=30&type=${type}`,
                        };
                    }
                    if (xCoord < 0 || xCoord > 100 || yCoord < 0 || yCoord > 100) {
                        return {
                            success: false,
                            error: 'Invalid coordinates. x and y must be between 0 and 100 for Panda',
                            example: `/api/bank/${bankCode}/test/swipe/{deviceId}?x=50&y=30&type=${type}`,
                        };
                    }
                    pandaOptions.x = xCoord.toString();
                    pandaOptions.y = yCoord.toString();
                }
                this.logger.log(`Testing Panda swipe on device: ${deviceId} with type=${type}${x && y ? `, x=${x}, y=${y}` : ' (swipe direction, no coordinates)'}`);
                await this.wsService.swipe(deviceId, pandaOptions);
                return {
                    success: true,
                    message: `Panda swipe completed successfully on device ${deviceId}`,
                    coordinates: {
                        type: type,
                        ...(x && y ? { x, y } : {}),
                    },
                };
            }
            else if (isHCFormat) {
                if (!x || !y || !endX || !endY) {
                    return {
                        success: false,
                        error: 'For HC format: x, y, endX, and endY are required',
                        example: `/api/bank/${bankCode}/test/swipe/{deviceId}?x=0.2&y=0.5&endX=0.8&endY=0.5&duration=0.3`,
                    };
                }
                const xCoord = parseFloat(x);
                const yCoord = parseFloat(y);
                const endXCoord = parseFloat(endX);
                const endYCoord = parseFloat(endY);
                const durationValue = duration ? parseFloat(duration) : 0.2;
                if (isNaN(xCoord) || isNaN(yCoord) || isNaN(endXCoord) || isNaN(endYCoord)) {
                    return {
                        success: false,
                        error: 'Invalid coordinates. x, y, endX, and endY must be numbers between 0 and 1 for HC',
                        example: `/api/bank/${bankCode}/test/swipe/{deviceId}?x=0.2&y=0.5&endX=0.8&endY=0.5&duration=0.3`,
                    };
                }
                if (xCoord < 0 || xCoord > 1 || yCoord < 0 || yCoord > 1 ||
                    endXCoord < 0 || endXCoord > 1 || endYCoord < 0 || endYCoord > 1) {
                    return {
                        success: false,
                        error: 'Invalid coordinates. x, y, endX, and endY must be between 0 and 1 for HC',
                        example: `/api/bank/${bankCode}/test/swipe/{deviceId}?x=0.2&y=0.5&endX=0.8&endY=0.5&duration=0.3`,
                    };
                }
                this.logger.log(`Testing HC swipe from (${xCoord}, ${yCoord}) to (${endXCoord}, ${endYCoord}) on device: ${deviceId}`);
                await this.wsService.swipe(deviceId, {
                    x: xCoord,
                    y: yCoord,
                    endX: endXCoord,
                    endY: endYCoord,
                    duration: durationValue,
                });
                return {
                    success: true,
                    message: `HC swipe completed successfully from (${xCoord}, ${yCoord}) to (${endXCoord}, ${endYCoord}) on device ${deviceId}`,
                    coordinates: {
                        start: { x: xCoord, y: yCoord },
                        end: { x: endXCoord, y: endYCoord },
                        duration: durationValue,
                    },
                };
            }
            else {
                return {
                    success: false,
                    error: `Invalid box type configuration: ${config_1.config.boxType}. Must be 'HC' or 'PANDA'`,
                };
            }
        }
        catch (error) {
            this.logger.error(`Error testing swipe: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testInputNumpadNumber(bankCode, deviceId, number) {
        try {
            if (!number || number.trim().length === 0) {
                return {
                    success: false,
                    error: 'Number is required and cannot be empty',
                    example: `/api/bank/${bankCode}/test/input-numpad/{deviceId}?number=123456`,
                };
            }
            if (!/^\d+$/.test(number)) {
                return {
                    success: false,
                    error: 'Number must contain only digits (0-9)',
                    example: `/api/bank/${bankCode}/test/input-numpad/{deviceId}?number=123456`,
                };
            }
            this.logger.log(`Testing numpad number input "${number}" on device: ${deviceId}`);
            await this.wsService.inputNumpadNumber(deviceId, number);
            return {
                success: true,
                message: `Numpad number input completed successfully on device ${deviceId}`,
                data: {
                    number: number,
                    digits: number.split('').map(d => parseInt(d)),
                },
            };
        }
        catch (error) {
            this.logger.error(`Error testing numpad number input: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testInputText(bankCode, deviceId, text) {
        try {
            if (!text || text.trim().length === 0) {
                return {
                    success: false,
                    error: 'Text is required and cannot be empty',
                    example: `/api/bank/${bankCode}/test/input-text/{deviceId}?text=abc123`,
                };
            }
            this.logger.log(`Testing text input "${text}" on device: ${deviceId}`);
            await this.wsService.inputText(deviceId, text);
            return {
                success: true,
                message: `Text input completed successfully on device ${deviceId}`,
            };
        }
        catch (error) {
            this.logger.error(`Error testing text input: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testPressReturn(bankCode, deviceId) {
        try {
            this.logger.log(`Testing press return key on device: ${deviceId}`);
            await this.wsService.pressReturnKey(deviceId);
            return {
                success: true,
                message: `Return key pressed successfully on device ${deviceId}`,
                note: 'This key can dismiss keyboard or submit/enter depending on context',
            };
        }
        catch (error) {
            this.logger.error(`Error testing press return: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async testRoi(bankCode, deviceId, x, y, width, height) {
        const folderPath = 'C:/testroi';
        try {
            await (0, promises_1.rm)(folderPath, { recursive: true, force: true });
            this.logger.log(`Đã xóa folder ${folderPath}`);
        }
        catch (error) {
            this.logger.debug(`Không thể xóa folder: ${error.message}`);
        }
        await (0, promises_1.mkdir)(folderPath, { recursive: true });
        await this.wsService.captureScreen(deviceId, {
            folderPath: folderPath,
        });
        const imaggePath = await this.bankService.getLatestImagePath(folderPath);
        const imageBuffer = await (0, promises_1.readFile)(imaggePath);
        const processedImage = await this.imagePreprocessingService.preprocess(imageBuffer, {
            x: parseFloat(x),
            y: parseFloat(y),
            width: parseFloat(width),
            height: parseFloat(height),
        }, undefined, {
            grayscale: true,
            enhanceContrast: true
        });
        const ocrResult = await this.ocrService.recognizeFromBuffer(processedImage.buffer);
        const outputPath = `${folderPath}/processed-${Date.now()}.png`;
        await (0, promises_1.writeFile)(outputPath, processedImage.buffer);
        return {
            ...ocrResult,
            normalizedText: (0, string_1.removeVietnameseTones)(ocrResult.text),
        };
    }
};
exports.BankController = BankController;
__decorate([
    (0, common_1.Get)('devices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of available devices' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of devices retrieved successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Post)('test/launch-app/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Test launching bank app on a device' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'App launched successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testLaunchApp", null);
__decorate([
    (0, common_1.Post)('test/capture-screen/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Test screen capture on a device' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiQuery)({ name: 'name', description: 'Screen capture name (optional)', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'quality', description: 'Image quality (0-1, default: 0.5)', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Screen captured successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Query)('name')),
    __param(3, (0, common_1.Query)('quality')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testCaptureScreen", null);
__decorate([
    (0, common_1.Post)('test/click/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Test clicking at specific coordinates on a device' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiQuery)({ name: 'x', description: 'X coordinate (HC: 0-1, Panda: 0-100)', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'y', description: 'Y coordinate (Hc: 0-1), Panda: 0-100', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Click completed successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Query)('x')),
    __param(3, (0, common_1.Query)('y')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testClickAtCoordinates", null);
__decorate([
    (0, common_1.Post)('test/swipe/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Test swiping on a device. Format is determined by config.boxType (HC or PANDA)' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiQuery)({ name: 'x', description: 'X coordinate (HC: 0-1, Panda: 0-100). Required for HC and Panda types 0,1,2,10. Optional for Panda types 4,5,6,7,8,9', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'y', description: 'Y coordinate (HC: 0-1, Panda: 0-100). Required for HC and Panda types 0,1,2,10. Optional for Panda types 4,5,6,7,8,9', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'type', description: 'Panda pointer event type: 0=按下(press), 1=抬起(lift), 2=移动(move), 4=滚轮向上(scroll up), 5=滚轮向下(scroll down), 6=上滑(swipe up), 7=下滑(swipe down), 8=左滑(swipe left), 9=右滑(swipe right), 10=点击(click). Required for Panda format.', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endX', description: 'End X coordinate for HC (required for HC: 0-1)', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endY', description: 'End Y coordinate for HC (required for HC: 0-1)', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'duration', description: 'Swipe duration for HC (default: 0.2)', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Swipe completed successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Query)('x')),
    __param(3, (0, common_1.Query)('y')),
    __param(4, (0, common_1.Query)('type')),
    __param(5, (0, common_1.Query)('endX')),
    __param(6, (0, common_1.Query)('endY')),
    __param(7, (0, common_1.Query)('duration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testSwipe", null);
__decorate([
    (0, common_1.Post)('test/input-numpad/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Test inputting number using numpad layout on a device' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiQuery)({ name: 'number', description: 'Number string to input (e.g., "123", "456789")', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Numpad number input completed successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Query)('number')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testInputNumpadNumber", null);
__decorate([
    (0, common_1.Post)('test/input-text/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Test inputting text using keyboard layout on a device' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiQuery)({ name: 'text', description: 'Text string to input (e.g., "abc123", "test@email.com")', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Text input completed successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Param)('deviceId')),
    __param(2, (0, common_1.Query)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testInputText", null);
__decorate([
    (0, common_1.Post)('test/press-return/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Test pressing return key on a device' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Return key pressed successfully' }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testPressReturn", null);
__decorate([
    (0, common_1.Post)('test/roi'),
    (0, swagger_1.ApiOperation)({ summary: 'Test ROI detection on a device' }),
    (0, swagger_1.ApiParam)({ name: 'bankCode', description: 'Bank code (ACB, PGBANK, etc.)' }),
    (0, swagger_1.ApiQuery)({ name: 'deviceId', description: 'Device ID' }),
    (0, swagger_1.ApiQuery)({ name: 'x', description: 'X coordinate', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'y', description: 'Y coordinate', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'width', description: 'Width', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'height', description: 'Height', required: true }),
    __param(0, (0, common_1.Param)('bankCode')),
    __param(1, (0, common_1.Query)('deviceId')),
    __param(2, (0, common_1.Query)('x')),
    __param(3, (0, common_1.Query)('y')),
    __param(4, (0, common_1.Query)('width')),
    __param(5, (0, common_1.Query)('height')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BankController.prototype, "testRoi", null);
exports.BankController = BankController = __decorate([
    (0, swagger_1.ApiTags)('bank'),
    (0, common_1.Controller)('api/bank/:bankCode'),
    __param(1, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [bank_service_1.BankService, Object, image_preprocessing_service_1.ImagePreprocessingService,
        ocr_service_1.OCRService])
], BankController);
//# sourceMappingURL=bank.controller.js.map