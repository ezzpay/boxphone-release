type RestartParams = {
    processName: string;
    exePath?: string;
    startTarget?: string;
    gracefulWaitMs?: number;
    forceKillWaitMs?: number;
    startDelayMs?: number;
    runAsAdmin?: boolean;
    killAsAdmin?: boolean;
};
export declare class WindowsAppGitBashService {
    private readonly logger;
    restartApp(params: RestartParams): Promise<void>;
    private closeMainWindow;
    private forceKill;
    private forceKillWithPowerShell;
    private isRunning;
    private waitUntilNotRunning;
    private startApp;
    private escapePs;
}
export {};
