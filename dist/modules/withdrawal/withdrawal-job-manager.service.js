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
exports.WithdrawalJobManagerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const withdrawal_service_1 = require("./withdrawal.service");
const device_service_1 = require("../device/device.service");
const device_lock_service_1 = require("../device/device-lock.service");
const websocket_1 = require("../../common/modules/websocket/constants/websocket");
const withdrawal_interface_1 = require("../../common/interfaces/withdrawal.interface");
const withdrawal_errors_1 = require("./withdrawal-errors");
const lodash_1 = require("lodash");
const cron_lock_1 = require("../../common/redis/cron-lock");
const bank_service_1 = require("../bank/bank.service");
const notification_service_1 = require("../notifiction/notification.service");
const window_app_service_1 = require("../window-app/window-app.service");
const redis_lock_service_1 = require("../redis-lock/redis-lock.service");
const lock_1 = require("./constants/lock");
const telegram_service_1 = require("../notifiction/telegram.service");
const time_1 = require("../../common/utils/time");
const object_validation_1 = require("../../common/utils/object-validation");
const redis_service_1 = require("../../common/services/redis.service");
const job_1 = require("./constants/job");
const config_1 = require("../../common/constants/config");
const withdrawal_status_1 = require("./constants/withdrawal-status");
let WithdrawalJobManagerService = class WithdrawalJobManagerService {
    constructor(withdrawalQueue, withdrawalService, deviceService, deviceLockService, wsService, bankService, notificationService, windowsAppGitBashService, redisLockService, telegramService, redisService) {
        this.withdrawalQueue = withdrawalQueue;
        this.withdrawalService = withdrawalService;
        this.deviceService = deviceService;
        this.deviceLockService = deviceLockService;
        this.wsService = wsService;
        this.bankService = bankService;
        this.notificationService = notificationService;
        this.windowsAppGitBashService = windowsAppGitBashService;
        this.redisLockService = redisLockService;
        this.telegramService = telegramService;
        this.redisService = redisService;
        this.logger = new common_1.Logger('WithdrawalJobManagerService');
        this.processingJobs = new Set();
        this.isInitialized = false;
        this.isRestartingBoxphone = false;
        this.cronRestartBoxphoneEnabled = false;
    }
    async onModuleInit() {
        this.logger.log('WithdrawalJobManagerService initialized, waiting 5 seconds before starting...');
        this.initializeJobProcessing();
        this.scheduleCronRestartBoxphone();
    }
    async initializeJobProcessing() {
        setTimeout(async () => {
            if (this.isInitialized) {
                return;
            }
            this.logger.log('Starting withdrawal job processing...');
            await this.pickAndProcessJobs();
            this.isInitialized = true;
        }, 5000);
    }
    scheduleCronRestartBoxphone() {
        const now = new Date();
        const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        setTimeout(() => {
            this.cronRestartBoxphoneEnabled = true;
        }, msToNextMinute);
    }
    async restartBoxphone() {
        const hasTransferGoing = await this.deviceLockService.hasAnyLockKeys();
        if (!hasTransferGoing) {
            const messageTitle = config_1.config.NODE_ENV === 'development'
                ? '🚀🚀🚀 <b>Boxphone software(local dev)...</b>'
                : '🚀🚀🚀 <b>Boxphone software...</b>';
            this.telegramService
                .sendMessage({
                text: messageTitle
                    + `\n\n<b>Khởi động lại:</b> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
                    + '\n<b>Dự kiến:</b> 3 phút.',
                options: {
                    parseMode: 'HTML'
                }
            });
            await this.windowsAppGitBashService.restartApp({
                processName: 'xiaowei_iphone.exe',
                exePath: 'C:/Users/Public/Desktop/效卫苹果投屏.lnk',
                runAsAdmin: true,
                killAsAdmin: true
            });
            this.telegramService
                .sendMessage({
                text: '✅ <b>Boxphone software</b>'
                    + `\n\n<b>Khởi động lại thành công:</b> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
                    + '\nLogin tất cả thiết bị sau 1 phút:',
                options: {
                    parseMode: 'HTML'
                }
            });
            try {
                await (0, time_1.sleep)(5000);
                await this.bankService.loginAllActiveBanks();
            }
            catch (error) {
                this.logger.error(`Error logging in all active banks: ${error.stack}`);
            }
            finally {
                await (0, time_1.sleep)(1000);
                await this.redisLockService.releaseLock(lock_1.SYSTEM_LOCK_BOXPHONE);
            }
        }
    }
    async pickAndProcessJobs(count) {
        try {
            const isNeedRestartBoxphone = await this.redisLockService.getLock(lock_1.SYSTEM_LOCK_BOXPHONE);
            if (isNeedRestartBoxphone) {
                if (this.isRestartingBoxphone) {
                    return;
                }
                this.isRestartingBoxphone = true;
                await this.restartBoxphone();
                this.isRestartingBoxphone = false;
                return;
            }
            if (!this.wsService.isConnectedStatus()) {
                this.logger.error(`WebSocket is not connected, cannot pick jobs`);
                return;
            }
            const serviceStatus = await this.deviceService.getServiceStatus();
            if (serviceStatus !== 'active') {
                this.logger.debug(`Service is ${serviceStatus}, cannot pick jobs`);
                return;
            }
            const availableDevices = await this.deviceService.getAvailableDevices();
            const capacity = availableDevices.length;
            if (capacity <= 0) {
                return;
            }
            const jobsToPick = count ? Math.min(count, capacity) : capacity;
            const waitingJobsWithScore = await this.redisService.pickFromZSet(job_1.JOB_PRIORITY_KEY, jobsToPick);
            if (waitingJobsWithScore.length === 0) {
                return;
            }
            this.logger.log(`Found ${availableDevices.length} available devices. ` +
                `Picking ${waitingJobsWithScore.length} jobs (${(waitingJobsWithScore || []).length} waiting).`);
            for (let i = 0; i < waitingJobsWithScore.length; i++) {
                const jobId = waitingJobsWithScore[i].jobId;
                const job = await this.withdrawalQueue.getJob(jobId);
                const device = availableDevices[i];
                if (this.processingJobs.has(job.id)) {
                    continue;
                }
                const operationId = `withdraw:${job.data.withdrawalId}:${device.deviceId}`;
                const lockAcquired = await this.deviceLockService.acquireLock(device.deviceId, 'transfer', operationId, 3.68 * 60 * 1000);
                if (!lockAcquired) {
                    this.logger.warn(`Device ${device.deviceId} was locked after assignment, skipping job ${job.id}`);
                    continue;
                }
                this.processJob(job, device)
                    .catch(error => {
                    this.logger.error(`Error processing job ${job.id}: ${error.message}`, error.stack);
                })
                    .finally(() => {
                    this.deviceLockService.releaseLock(device.deviceId).catch(() => { });
                });
            }
        }
        catch (error) {
            this.logger.error(`Error picking jobs: ${error.message}`, error.stack);
        }
    }
    async processJob(job, deviceConfig) {
        let withdrawal;
        try {
            withdrawal = (0, lodash_1.cloneDeep)(job.data);
            await job.remove();
            const validateJob = await (0, object_validation_1.validateObjectResult)(withdrawal_interface_1.Withdrawal, withdrawal);
            if (!validateJob.ok) {
                throw new withdrawal_errors_1.WithdrawalProcessingError(`Invalid withdrawal: missing ${validateJob.errors.map(error => error.property).join(', ')}`, withdrawal_errors_1.ErrorType.PERMANENT);
            }
            const { _id, withdrawalId } = withdrawal;
            this.logger.log(`Successfully picked and removed withdrawal ${withdrawalId} from queue`);
            this.processingJobs.add(job.id);
            const withdrawalDetails = await this.withdrawalService.getWithdrawalDetails(_id);
            if (![withdrawal_status_1.WithdrawalStatus.PENDING, withdrawal_status_1.WithdrawalStatus.RETRY].includes(withdrawalDetails.status)) {
                this.logger.warn(`WDA ${withdrawalId} (${withdrawalDetails.status}) is not pending or retry, skipping`);
                throw new withdrawal_errors_1.WithdrawalProcessingError(`Withdrawal not pending or retry, skipping (${withdrawalDetails.status})`, withdrawal_errors_1.ErrorType.PERMANENT);
            }
            if (withdrawalDetails.status === withdrawal_status_1.WithdrawalStatus.RETRY) {
                this.telegramService.sendMessage({
                    text: `🚀🚀🚀 <b>Retrying Withdrawal...</b>`
                        + `\n${withdrawal.withdrawalId} - ${withdrawal.withdrawalCode}`
                        + `\n\n<b>From:</b>  ${deviceConfig.bankCode} - ${deviceConfig.accountName}`
                        + `\n<b>To:</b> ${withdrawal.bankCode} - ${withdrawal.beneficiaryAccountNo} - ${withdrawal.beneficiaryName}`
                        + `\n<b>Amount:</b>  ${withdrawal.amount}`
                        + `\n<b>Description:</b>  ${withdrawal.description}`,
                    options: {
                        parseMode: 'HTML'
                    }
                }).catch((error) => {
                    this.logger.error(`Error sending message for withdrawal ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                });
            }
            this.notificationService
                .updateWithdrawal(_id, {
                status: withdrawal_status_1.WithdrawalStatus.PROCESSING,
                sourceBankCode: deviceConfig.bankCode,
                sourceAccountNo: deviceConfig.accountNo,
                sourceAccountName: deviceConfig.accountName,
            })
                .catch((error) => {
                this.logger.error(`Error updating withdrawal status for ${withdrawalId}: ${error.message}`, error.stack);
            });
            await this.bankService.createQRCodeAndTransferTo(deviceConfig.bankCode, deviceConfig.deviceId, withdrawal);
            await this.bankService.createBillFolder(deviceConfig.bankCode, withdrawal.withdrawalCode);
            await this.withdrawalService.processWithdrawal(withdrawal, deviceConfig);
        }
        catch (error) {
            let errorType;
            let errorContext;
            if (error instanceof withdrawal_errors_1.WithdrawalProcessingError) {
                errorType = error.errorType;
                errorContext = error.context;
                this.logger.error(`Controlled Error ${withdrawal.withdrawalId}: ${errorType}-${error.message}`, error.stack);
                await this.handleJobFailure(deviceConfig, withdrawal, error.message, errorType, errorContext);
            }
            else {
                this.logger.error(`Uncontrolled Error ${withdrawal.withdrawalId}: ${errorType}-${error.message}`, error.stack);
                await this.bankService.createBillFolder(deviceConfig.bankCode, withdrawal.withdrawalCode);
                await (0, time_1.sleep)(1000);
                await this.bankService.captureScreen(deviceConfig.bankCode, deviceConfig.deviceId, withdrawal.withdrawalCode);
                const billImagePath = await this.bankService.getBillImagePath(deviceConfig.bankCode, withdrawal.withdrawalCode);
                if (billImagePath) {
                    this.logger.log(`Uploading receipt for withdrawal ${withdrawal.withdrawalCode} - ${billImagePath}`);
                    await this.notificationService.uploadReceipt(withdrawal._id, billImagePath);
                }
                await this.notificationService.updateWithdrawal(withdrawal._id, {
                    status: withdrawal_status_1.WithdrawalStatus.UNKNOWN
                });
                this.telegramService.sendMessage({
                    text: `❌ <b>Failed Withdraw.</b>`
                        + `\n${withdrawal.withdrawalId}`
                        + `\n${withdrawal.withdrawalCode}`
                        + `\n${error.message}`
                        + `\n\n<b>From:</b>  ${deviceConfig.bankCode} - ${deviceConfig.accountName}`
                        + `\n<b>To:</b> ${withdrawal.bankCode} - ${withdrawal.beneficiaryAccountNo} - ${withdrawal.beneficiaryName}`
                        + `\n<b>Amount:</b>  ${withdrawal.amount}`
                        + `\n<b>Description:</b>  ${withdrawal.description}`,
                    options: {
                        parseMode: 'HTML'
                    }
                }).catch((error) => {
                    this.logger.error(`Error sending message for withdrawal ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                });
                await this.bankService.login(deviceConfig.bankCode, deviceConfig.deviceId, true);
            }
        }
        finally {
            this.processingJobs.delete(job.id);
        }
    }
    async handleJobFailure(deviceConfig, withdrawal, reason, errorType = withdrawal_errors_1.ErrorType.PERMANENT, errorContext = '') {
        const maxRetries = 2;
        const currentRetries = withdrawal.manualRetryCount ?? 1;
        switch (errorType) {
            case withdrawal_errors_1.ErrorType.PERMANENT:
                this.notificationService
                    .updateWithdrawal(withdrawal._id, {
                    status: withdrawal_status_1.WithdrawalStatus.FAILED
                })
                    .catch((error) => {
                    this.logger.error(`Error updating withdrawal status for ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                });
                await this.bankService.login(deviceConfig.bankCode, deviceConfig.deviceId, true);
                return;
            case withdrawal_errors_1.ErrorType.FORCE_LOGIN_NO_REQUEUE:
                await this.bankService.login(deviceConfig.bankCode, deviceConfig.deviceId, true);
                return;
            case withdrawal_errors_1.ErrorType.NO_BILL_AFTER_OTP:
                await this.bankService.captureScreen(deviceConfig.bankCode, deviceConfig.deviceId, withdrawal.withdrawalCode);
                const billImagePath = await this.bankService.getBillImagePath(deviceConfig.bankCode, withdrawal.withdrawalCode);
                if (billImagePath) {
                    this.logger.log(`Uploading receipt for withdrawal ${withdrawal.withdrawalCode} - ${billImagePath}`);
                    await this.notificationService.uploadReceipt(withdrawal._id, billImagePath);
                }
                await this.notificationService.updateWithdrawal(withdrawal._id, {
                    status: withdrawal_status_1.WithdrawalStatus.UNKNOWN
                });
                await this.bankService.login(deviceConfig.bankCode, deviceConfig.deviceId, true);
                return;
            case withdrawal_errors_1.ErrorType.FORCE_LOGIN_AND_REQUEUE:
                this.logger.warn(`Added ${withdrawal.withdrawalId} to queue for retrying. (${currentRetries}/${maxRetries})` +
                    `Reason: ${reason}. ` +
                    `Error Type: ${errorType}.`);
                if (currentRetries < maxRetries) {
                    await this.withdrawalQueue.add('process-withdrawal-request', {
                        ...withdrawal,
                        manualRetryCount: currentRetries + 1,
                        lastErrorType: errorType,
                        lastErrorReason: reason
                    }, {
                        attempts: 0,
                        removeOnComplete: false,
                        removeOnFail: false,
                        jobId: `withdrawal-request-${withdrawal.withdrawalId}`,
                        priority: 1,
                        delay: 30000,
                    });
                    this.notificationService
                        .updateWithdrawal(withdrawal._id, {
                        status: withdrawal_status_1.WithdrawalStatus.RETRY
                    })
                        .catch((error) => {
                        this.logger.error(`Error updating withdrawal status for ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                    });
                    this.telegramService.sendMessage({
                        text: `❌ <b>Failed Withdraw. Retrying...</b>`
                            + `\n${withdrawal.withdrawalId}`
                            + `\n${withdrawal.withdrawalCode}`
                            + `\n${errorContext}`
                            + `\n\n<b>From:</b>  ${deviceConfig.bankCode} - ${deviceConfig.accountName}`
                            + `\n<b>To:</b> ${withdrawal.bankCode} - ${withdrawal.beneficiaryAccountNo} - ${withdrawal.beneficiaryName}`
                            + `\n<b>Amount:</b>  ${withdrawal.amount}`
                            + `\n<b>Description:</b>  ${withdrawal.description}`,
                        options: {
                            parseMode: 'HTML'
                        }
                    }).catch((error) => {
                        this.logger.error(`Error sending message for withdrawal ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                    });
                }
                else {
                    this.logger.warn(`Max retries (${maxRetries}) exceeded for withdrawal ${withdrawal.withdrawalId}: ${errorType} error: ${reason}`);
                    this.notificationService
                        .updateWithdrawal(withdrawal._id, {
                        status: withdrawal_status_1.WithdrawalStatus.FAILED
                    })
                        .catch((error) => {
                        this.logger.error(`Error updating withdrawal status for ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                    });
                    await this.bankService.captureScreen(deviceConfig.bankCode, deviceConfig.deviceId, withdrawal.withdrawalCode);
                    const billImagePath = await this.bankService.getBillImagePath(deviceConfig.bankCode, withdrawal.withdrawalCode);
                    const caption = `❌ <b>Failed Withdraw. Max retries exceeded...</b>`
                        + `\n${withdrawal.withdrawalId}`
                        + `\n${withdrawal.withdrawalCode}`
                        + `\n${errorContext}`
                        + `\n\n<b>From:</b>  ${deviceConfig.bankCode} - ${deviceConfig.accountName}`
                        + `\n<b>To:</b> ${withdrawal.bankCode} - ${withdrawal.beneficiaryAccountNo} - ${withdrawal.beneficiaryName}`
                        + `\n<b>Amount:</b>  ${withdrawal.amount}`
                        + `\n<b>Description:</b>  ${withdrawal.description}`;
                    await this.telegramService.sendPhotoByFile({
                        filePath: billImagePath,
                        options: {
                            parseMode: 'HTML',
                            caption
                        }
                    });
                }
                await this.bankService.login(deviceConfig.bankCode, deviceConfig.deviceId, true);
                break;
            case withdrawal_errors_1.ErrorType.TEMPORARY:
                this.logger.warn(`Added ${withdrawal.withdrawalId} to queue for retrying. (${currentRetries}/${maxRetries})` +
                    `Reason: ${reason}. ` +
                    `Error Type: ${errorType}.`);
                if (currentRetries < maxRetries) {
                    await this.withdrawalQueue.add('process-withdrawal-request', {
                        ...withdrawal,
                        manualRetryCount: currentRetries + 1,
                        lastErrorType: errorType,
                        lastErrorReason: reason
                    }, {
                        attempts: 0,
                        removeOnComplete: false,
                        removeOnFail: false,
                        jobId: `withdrawal-request-${withdrawal.withdrawalId}`,
                        priority: 1,
                        delay: 30000,
                    });
                    this.notificationService
                        .updateWithdrawal(withdrawal._id, {
                        status: withdrawal_status_1.WithdrawalStatus.RETRY
                    })
                        .catch((error) => {
                        this.logger.error(`Error updating withdrawal status for ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                    });
                    this.telegramService.sendMessage({
                        text: `❌ <b>Failed Withdraw. Retrying...</b>`
                            + `\n${withdrawal.withdrawalId}`
                            + `\n${withdrawal.withdrawalCode}`
                            + `\n${errorContext}`
                            + `\n\n<b>From:</b>  ${deviceConfig.bankCode} - ${deviceConfig.accountName}`
                            + `\n<b>To:</b> ${withdrawal.bankCode} - ${withdrawal.beneficiaryAccountNo} - ${withdrawal.beneficiaryName}`
                            + `\n<b>Amount:</b>  ${withdrawal.amount}`
                            + `\n<b>Description:</b>  ${withdrawal.description}`,
                        options: {
                            parseMode: 'HTML'
                        }
                    }).catch((error) => {
                        this.logger.error(`Error sending message for withdrawal ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                    });
                }
                else {
                    this.logger.warn(`Max retries (${maxRetries}) exceeded for withdrawal ${withdrawal.withdrawalId}: ${errorType} error: ${reason}`);
                    this.notificationService
                        .updateWithdrawal(withdrawal._id, {
                        status: withdrawal_status_1.WithdrawalStatus.FAILED
                    })
                        .catch((error) => {
                        this.logger.error(`Error updating withdrawal status for ${withdrawal.withdrawalId}: ${error.message}`, error.stack);
                    });
                    await this.bankService.captureScreen(deviceConfig.bankCode, deviceConfig.deviceId, withdrawal.withdrawalCode);
                    const billImagePath = await this.bankService.getBillImagePath(deviceConfig.bankCode, withdrawal.withdrawalCode);
                    const caption = `❌ <b>Failed Withdraw. Max retries exceeded...</b>`
                        + `\n${withdrawal.withdrawalId}`
                        + `\n${withdrawal.withdrawalCode}`
                        + `\n${errorContext}`
                        + `\n\n<b>From:</b>  ${deviceConfig.bankCode} - ${deviceConfig.accountName}`
                        + `\n<b>To:</b> ${withdrawal.bankCode} - ${withdrawal.beneficiaryAccountNo} - ${withdrawal.beneficiaryName}`
                        + `\n<b>Amount:</b>  ${withdrawal.amount}`
                        + `\n<b>Description:</b>  ${withdrawal.description}`;
                    await this.telegramService.sendPhotoByFile({
                        filePath: billImagePath,
                        options: {
                            parseMode: 'HTML',
                            caption
                        }
                    });
                }
                break;
        }
    }
    async promoteDelayedJobs() {
        return (0, cron_lock_1.withCronLock)('cron:promote_delayed:withdrawal', 5000, async () => {
            const now = Date.now();
            const BATCH = 100;
            const delayedJobs = await this.withdrawalQueue.getJobs(['delayed'], 0, BATCH - 1);
            if (!delayedJobs.length)
                return;
            let promoted = 0;
            for (const job of delayedJobs) {
                const delayMs = typeof job.opts?.delay === 'number' ? job.opts.delay : 0;
                const ts = typeof job.timestamp === 'number' ? job.timestamp : 0;
                const dueAt = ts + delayMs;
                if (dueAt <= now) {
                    try {
                        await job.promote();
                        promoted++;
                    }
                    catch (e) {
                        this.logger.debug(`Promote skipped for job ${job.id}: ${String(e)}`);
                    }
                }
            }
            if (promoted > 0) {
                this.logger.log(`Promoted ${promoted} delayed jobs to waiting`);
            }
        });
    }
    async triggerPickJobs(count = 1) {
        await this.pickAndProcessJobs(count);
    }
    async getQueueStats() {
        const [waiting, delayed, active, completed, failed, availableDevices, serviceStatus] = await Promise.all([
            this.withdrawalQueue.getWaitingCount(),
            this.withdrawalQueue.getDelayedCount(),
            this.withdrawalQueue.getActiveCount(),
            this.withdrawalQueue.getCompletedCount(),
            this.withdrawalQueue.getFailedCount(),
            this.deviceService.getAvailableDevices(),
            this.deviceService.getServiceStatus(),
        ]);
        return {
            serviceStatus,
            activeDevices: availableDevices.length,
            processingJobs: this.processingJobs.size,
            isInitialized: this.isInitialized,
            queue: {
                waiting,
                delayed,
                active,
                completed,
                failed,
                total: waiting + delayed + active,
            },
        };
    }
    async debugQueue() {
        const stats = await this.getQueueStats();
        const [waitingJobs, delayedJobs] = await Promise.all([
            this.withdrawalQueue.getJobs(['waiting'], 0, 9),
            this.withdrawalQueue.getJobs(['delayed'], 0, 9),
        ]);
        return {
            ...stats,
            sampleWaitingJobs: waitingJobs.map(job => ({
                id: job.id,
                data: job.data,
                opts: job.opts,
                manualRetryCount: job.data.manualRetryCount
            })),
            sampleDelayedJobs: delayedJobs.map(job => ({
                id: job.id,
                data: job.data,
                opts: job.opts,
                manualRetryCount: job.data.manualRetryCount
            })),
        };
    }
    async periodicJobPicking() {
        const doesPauseProcessingJob = await this.redisLockService.isLocked(lock_1.SYSTEM_LOCK_PAUSE_PROCESSING);
        if (doesPauseProcessingJob) {
            this.logger.warn('Transfer is paused by admin temporarily!');
            return;
        }
        await this.pickAndProcessJobs();
    }
    async promoteDelayedJobsPeriodically() {
        await this.promoteDelayedJobs();
    }
    async restartPandaBoxPeriodically() {
        const serviceStatus = await this.deviceService.getServiceStatus();
        if (this.cronRestartBoxphoneEnabled && serviceStatus === 'active') {
            await this.redisLockService.acquireLock(lock_1.SYSTEM_LOCK_BOXPHONE, 3 * 60 * 1000);
        }
    }
};
exports.WithdrawalJobManagerService = WithdrawalJobManagerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawalJobManagerService.prototype, "periodicJobPicking", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawalJobManagerService.prototype, "promoteDelayedJobsPeriodically", null);
__decorate([
    (0, schedule_1.Cron)('0 46 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawalJobManagerService.prototype, "restartPandaBoxPeriodically", null);
exports.WithdrawalJobManagerService = WithdrawalJobManagerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('wda-request')),
    __param(4, (0, common_1.Inject)(websocket_1.WEBSOCKET_SERVICE)),
    __metadata("design:paramtypes", [Object, withdrawal_service_1.WithdrawalService,
        device_service_1.DeviceService,
        device_lock_service_1.DeviceLockService, Object, bank_service_1.BankService,
        notification_service_1.NotificationService,
        window_app_service_1.WindowsAppGitBashService,
        redis_lock_service_1.RedisLockService,
        telegram_service_1.TelegramService,
        redis_service_1.RedisService])
], WithdrawalJobManagerService);
//# sourceMappingURL=withdrawal-job-manager.service.js.map