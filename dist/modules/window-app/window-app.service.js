"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WindowsAppGitBashService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowsAppGitBashService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const time_1 = require("../../common/utils/time");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let WindowsAppGitBashService = WindowsAppGitBashService_1 = class WindowsAppGitBashService {
    constructor() {
        this.logger = new common_1.Logger(WindowsAppGitBashService_1.name);
    }
    async restartApp(params) {
        const { processName, exePath, startTarget, gracefulWaitMs = 1200, forceKillWaitMs = 500, startDelayMs = 300, runAsAdmin = false, killAsAdmin = false, } = params;
        try {
            await this.closeMainWindow(processName).catch(() => { });
            await (0, time_1.sleep)(gracefulWaitMs);
            await this.forceKill(processName, killAsAdmin).catch(() => { });
            await (0, time_1.sleep)(forceKillWaitMs);
            await this.waitUntilNotRunning(processName, 5000).catch(() => { });
            await (0, time_1.sleep)(startDelayMs);
            if (exePath) {
                await this.startApp({ exePath, runAsAdmin });
                return;
            }
            if (startTarget) {
                await this.startApp({ startTarget, runAsAdmin });
                return;
            }
            const base = processName.replace(/\.exe$/i, '');
            await this.startApp({ startTarget: base, runAsAdmin });
        }
        catch (error) {
            const errorMsg = error?.message || String(error);
            this.logger.error(`[restart] Failed to restart app: ${errorMsg}`, error?.stack);
            throw error;
        }
    }
    async closeMainWindow(processName) {
        const base = processName.replace(/\.exe$/i, '');
        const psCommand = `Get-Process -Name "${this.escapePs(base)}" -ErrorAction SilentlyContinue | ForEach-Object { $_.CloseMainWindow() | Out-Null }`;
        const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${this.escapePs(psCommand)}"`;
        try {
            await execAsync(command, { windowsHide: true });
        }
        catch (error) {
            const errorMsg = error?.message || String(error) || '';
            if (!errorMsg.includes('Cannot find a process')) {
                throw error;
            }
        }
    }
    async forceKill(processName, useAdmin = false) {
        const base = processName.replace(/\.exe$/i, '');
        try {
            await this.forceKillWithPowerShell(base, useAdmin);
            return;
        }
        catch (error) {
            const errorMsg = (error?.message || error?.stderr || String(error) || '').toLowerCase();
            if (errorMsg.includes('cannot find a process') ||
                errorMsg.includes('process not found') ||
                errorMsg.includes('cannot find process')) {
                this.logger.debug(`Process not found (expected): ${processName}`);
                return;
            }
            if ((errorMsg.includes('access is denied') || errorMsg.includes('access denied')) &&
                !useAdmin) {
                this.logger.warn(`Access denied, retrying with admin privileges: ${processName}`);
                try {
                    await this.forceKillWithPowerShell(base, true);
                    return;
                }
                catch (retryError) {
                    const retryMsg = (retryError?.message || retryError?.stderr || String(retryError) || '').toLowerCase();
                    if (!retryMsg.includes('cannot find a process') &&
                        !retryMsg.includes('process not found')) {
                        this.logger.debug(`PowerShell kill with admin failed, trying taskkill: ${processName}`);
                    }
                    else {
                        return;
                    }
                }
            }
            try {
                const shouldUseAdmin = useAdmin || errorMsg.includes('access denied') || errorMsg.includes('access is denied');
                let command;
                if (shouldUseAdmin) {
                    const escapedProcessName = processName.replace(/"/g, '`"');
                    const psCommand = `Start-Process taskkill -ArgumentList '/F','/IM','${escapedProcessName}','/T' -Verb RunAs -Wait -WindowStyle Hidden`;
                    command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand.replace(/"/g, '`"').replace(/\$/g, '`$')}"`;
                }
                else {
                    command = `taskkill /F /IM "${processName}" /T`;
                }
                await execAsync(command, { windowsHide: true });
            }
            catch (taskkillError) {
                const taskkillMsg = (taskkillError?.message || taskkillError?.stderr || String(taskkillError) || '').toLowerCase();
                if (taskkillMsg.includes('not found') ||
                    taskkillMsg.includes('no tasks are running') ||
                    taskkillMsg.includes('the system cannot find')) {
                    this.logger.debug(`Process not found (expected): ${processName}`);
                    return;
                }
                if (taskkillMsg.includes('access is denied') || taskkillMsg.includes('access denied')) {
                    this.logger.warn(`Cannot kill process (access denied): ${processName}. Process may require administrator privileges to terminate.`);
                    return;
                }
                this.logger.warn(`Kill process warning: ${taskkillMsg}`);
            }
        }
    }
    async forceKillWithPowerShell(processBaseName, useAdmin = false) {
        const escapedName = processBaseName.replace(/'/g, "''");
        const killCommand = `Get-Process -Name '${escapedName}' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction Stop`;
        let command;
        if (useAdmin) {
            const escapedKillCommand = killCommand.replace(/'/g, "''").replace(/"/g, '`"');
            const psCommand = `Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',\"${escapedKillCommand}\" -Verb RunAs -Wait -WindowStyle Hidden`;
            command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand.replace(/"/g, '`"').replace(/\$/g, '`$')}"`;
        }
        else {
            command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${killCommand.replace(/"/g, '`"').replace(/\$/g, '`$')}"`;
        }
        try {
            await execAsync(command, { windowsHide: true });
        }
        catch (error) {
            const errorMsg = (error?.message || error?.stderr || String(error) || '').toLowerCase();
            if (errorMsg.includes('cannot find a process') ||
                errorMsg.includes('process not found') ||
                errorMsg.includes('cannot find process')) {
                this.logger.debug(`Process not found (expected): ${processBaseName}`);
                return;
            }
            throw error;
        }
    }
    async isRunning(processName) {
        try {
            const command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;
            const { stdout } = await execAsync(command, { windowsHide: true });
            const output = stdout.toLowerCase().trim();
            if (!output || output.includes('no tasks') || output === 'info:') {
                return false;
            }
            return output.includes(processName.toLowerCase());
        }
        catch (error) {
            return false;
        }
    }
    async waitUntilNotRunning(processName, timeoutMs) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const running = await this.isRunning(processName);
            if (!running) {
                return;
            }
            await (0, time_1.sleep)(250);
        }
        this.logger.warn(`Process still running after ${timeoutMs}ms: ${processName}`);
    }
    async startApp(args) {
        const target = args.exePath ?? args.startTarget ?? '';
        const runAsAdmin = args.runAsAdmin ?? false;
        if (!target) {
            throw new Error('Start target is empty');
        }
        try {
            if (runAsAdmin) {
                const escapedTarget = target.replace(/'/g, "''");
                const psCommand = `Start-Process -FilePath '${escapedTarget}' -Verb RunAs`;
                const escapedCommand = psCommand.replace(/"/g, '`"').replace(/\$/g, '`$');
                const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${escapedCommand}"`;
                await execAsync(command);
                this.logger.log(`App started with Administrator privileges: ${target}`);
            }
            else {
                const command = `start "" "${target}"`;
                await execAsync(command, { windowsHide: true });
                this.logger.log(`App started successfully: ${target}`);
            }
            await (0, time_1.sleep)(500);
        }
        catch (error) {
            const errorMsg = error?.message || String(error);
            this.logger.error(`Failed to start app: ${target}`, errorMsg);
            throw error;
        }
    }
    escapePs(value) {
        return value.replace(/"/g, '`"').replace(/\$/g, '`$');
    }
};
exports.WindowsAppGitBashService = WindowsAppGitBashService;
exports.WindowsAppGitBashService = WindowsAppGitBashService = WindowsAppGitBashService_1 = __decorate([
    (0, common_1.Injectable)()
], WindowsAppGitBashService);
//# sourceMappingURL=window-app.service.js.map