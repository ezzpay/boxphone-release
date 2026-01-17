export declare const validateObjectResult: <T extends object>(DtoClass: new () => T, payload: unknown) => Promise<{
    ok: boolean;
    instance: T;
    errors: import("class-validator").ValidationError[];
}>;
