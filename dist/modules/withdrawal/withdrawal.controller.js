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
exports.WithdrawalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const withdrawal_job_manager_service_1 = require("./withdrawal-job-manager.service");
let WithdrawalController = class WithdrawalController {
    constructor(jobManagerService) {
        this.jobManagerService = jobManagerService;
        this.logger = new common_1.Logger('WithdrawalController');
    }
    async getQueueStats() {
        return await this.jobManagerService.getQueueStats();
    }
    async debugQueue() {
        return await this.jobManagerService.debugQueue();
    }
    async triggerJobPicking() {
        this.logger.log('Manually triggering job picking...');
        await this.jobManagerService.triggerPickJobs(1);
        const stats = await this.jobManagerService.getQueueStats();
        return {
            success: true,
            message: 'Job picking triggered',
            stats,
        };
    }
};
exports.WithdrawalController = WithdrawalController;
__decorate([
    (0, common_1.Get)('queue/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get withdrawal queue statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Queue statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawalController.prototype, "getQueueStats", null);
__decorate([
    (0, common_1.Get)('queue/debug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed queue debug information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detailed queue debug info' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawalController.prototype, "debugQueue", null);
__decorate([
    (0, common_1.Post)('queue/trigger'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger job picking' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job picking triggered' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawalController.prototype, "triggerJobPicking", null);
exports.WithdrawalController = WithdrawalController = __decorate([
    (0, swagger_1.ApiTags)('withdrawal'),
    (0, common_1.Controller)('api/withdrawal'),
    __metadata("design:paramtypes", [withdrawal_job_manager_service_1.WithdrawalJobManagerService])
], WithdrawalController);
//# sourceMappingURL=withdrawal.controller.js.map