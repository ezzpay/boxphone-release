type TelegramChatId = string | number;
interface TelegramSendMessageOptions {
    parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
    disableWebPagePreview?: boolean;
    disableNotification?: boolean;
    replyToMessageId?: number;
}
interface TelegramSendPhotoOptions {
    caption?: string;
    parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
    disableNotification?: boolean;
}
export declare class TelegramService {
    private readonly logger;
    private readonly http;
    private readonly token;
    private readonly defaultChatId;
    private readonly baseUrl;
    constructor();
    sendMessage(params: {
        text: string;
        chatId?: TelegramChatId;
        options: TelegramSendMessageOptions;
    }): Promise<void>;
    sendPhotoByUrl(photoUrl: string, chatId?: TelegramChatId, options?: TelegramSendPhotoOptions): Promise<void>;
    sendPhotoByFile(data: {
        filePath: string;
        chatId?: TelegramChatId;
        options?: TelegramSendPhotoOptions;
    }): Promise<void>;
    sendPhotoByBuffer(buffer: Buffer, filename?: string, mimeType?: string, chatId?: TelegramChatId, options?: TelegramSendPhotoOptions): Promise<void>;
    sendPhotoByBase64(base64: string, filename?: string, mimeType?: string, chatId?: TelegramChatId, options?: TelegramSendPhotoOptions): Promise<void>;
    private mustDefaultChatId;
    private stripBase64Prefix;
    private requestWithRetry;
    private requestFormWithRetry;
    private isRetryable;
    private backoffMs;
    private safeErr;
}
export {};
