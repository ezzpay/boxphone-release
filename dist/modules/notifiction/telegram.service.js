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
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const time_1 = require("../../common/utils/time");
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const FormData = require("form-data");
const fs_1 = require("fs");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor() {
        this.logger = new common_1.Logger(TelegramService_1.name);
        this.token = '8514906447:AAGFB2Fsl21IeF1tJvt8y6UsuoyNCIVcwCE';
        this.defaultChatId = '-5288197652';
        this.baseUrl = 'https://api.telegram.org';
        this.http = axios_1.default.create({
            baseURL: `${this.baseUrl}/bot${this.token}`,
            timeout: 15000,
        });
    }
    async sendMessage(params) {
        const { text, chatId, options = {} } = params;
        const parsedChatId = chatId ?? this.mustDefaultChatId();
        return this.requestWithRetry('/sendMessage', {
            chat_id: parsedChatId,
            text,
            parse_mode: options.parseMode ?? 'HTML',
            disable_web_page_preview: options.disableWebPagePreview ?? false,
            disable_notification: options.disableNotification ?? false,
            reply_to_message_id: options.replyToMessageId ?? undefined,
        });
    }
    async sendPhotoByUrl(photoUrl, chatId = this.mustDefaultChatId(), options = {}) {
        await this.requestWithRetry('/sendPhoto', {
            chat_id: chatId,
            photo: photoUrl,
            caption: options.caption,
            parse_mode: options.parseMode,
            disable_notification: options.disableNotification,
        });
    }
    async sendPhotoByFile(data) {
        const { filePath, chatId, options = {} } = data;
        const parsedChatId = chatId ?? this.mustDefaultChatId();
        const stream = (0, fs_1.createReadStream)(filePath);
        const form = new FormData();
        form.append('chat_id', String(parsedChatId));
        form.append('photo', stream);
        if (options.caption)
            form.append('caption', options.caption);
        if (options.parseMode)
            form.append('parse_mode', options.parseMode);
        if (options.disableNotification !== undefined) {
            form.append('disable_notification', String(options.disableNotification));
        }
        return this.requestFormWithRetry('/sendPhoto', form);
    }
    async sendPhotoByBuffer(buffer, filename = 'image.png', mimeType = 'image/png', chatId = this.mustDefaultChatId(), options = {}) {
        const form = new FormData();
        form.append('chat_id', String(chatId));
        form.append('photo', buffer, { filename, contentType: mimeType });
        if (options.caption)
            form.append('caption', options.caption);
        if (options.parseMode)
            form.append('parse_mode', options.parseMode);
        if (options.disableNotification !== undefined) {
            form.append('disable_notification', String(options.disableNotification));
        }
        this.requestFormWithRetry('/sendPhoto', form)
            .catch((error) => {
            this.logger.error('Error sending telegram photo', error.stack);
        });
    }
    async sendPhotoByBase64(base64, filename = 'image.png', mimeType = 'image/png', chatId = this.mustDefaultChatId(), options = {}) {
        const cleaned = this.stripBase64Prefix(base64);
        const buffer = Buffer.from(cleaned, 'base64');
        await this.sendPhotoByBuffer(buffer, filename, mimeType, chatId, options);
    }
    mustDefaultChatId() {
        if (!this.defaultChatId) {
            throw new Error('TELEGRAM_DEFAULT_CHAT_ID is missing and no chatId was provided.');
        }
        return this.defaultChatId;
    }
    stripBase64Prefix(input) {
        const idx = input.indexOf('base64,');
        return idx >= 0 ? input.slice(idx + 'base64,'.length) : input;
    }
    async requestWithRetry(path, payload, retry = 2) {
        try {
            const res = await this.http.post(path, payload);
            if (!res.data?.ok) {
                const desc = res.data?.description ?? 'Unknown Telegram error';
                throw new Error(`Telegram API error: ${desc}`);
            }
        }
        catch (err) {
            if (retry > 0 && this.isRetryable(err)) {
                const waitMs = this.backoffMs(retry);
                this.logger.warn(`Telegram request failed, retrying in ${waitMs}ms: ${this.safeErr(err)}`);
                await (0, time_1.sleep)(waitMs);
                return this.requestWithRetry(path, payload, retry - 1);
            }
            this.logger.error(`Telegram request failed: ${this.safeErr(err)}`);
            throw err;
        }
    }
    async requestFormWithRetry(path, form, retry = 2) {
        try {
            const res = await this.http.post(path, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });
            if (!res.data?.ok) {
                const desc = res.data?.description ?? 'Unknown Telegram error';
                throw new Error(`Telegram API error: ${desc}`);
            }
        }
        catch (err) {
            if (retry > 0 && this.isRetryable(err)) {
                const waitMs = this.backoffMs(retry);
                this.logger.warn(`Telegram form request failed, retrying in ${waitMs}ms: ${this.safeErr(err)}`);
                await (0, time_1.sleep)(waitMs);
                return this.requestFormWithRetry(path, form, retry - 1);
            }
            this.logger.error(`Telegram form request failed: ${this.safeErr(err)}`);
        }
    }
    isRetryable(err) {
        const code = err?.code;
        const status = err?.response?.status;
        if (code === 'ECONNABORTED')
            return true;
        if (status >= 500 && status <= 599)
            return true;
        if (!status && (code === 'ENOTFOUND' || code === 'ECONNRESET' || code === 'EAI_AGAIN'))
            return true;
        return false;
    }
    backoffMs(retryLeft) {
        const step = (2 - retryLeft) + 1;
        return 400 * step;
    }
    safeErr(err) {
        const status = err?.response?.status;
        const desc = err?.response?.data?.description;
        const msg = err?.message;
        return [status ? `status=${status}` : '', desc ? `desc=${desc}` : '', msg ? `msg=${msg}` : '']
            .filter(Boolean)
            .join(' | ');
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map