export declare const scaleCoordinates: <T extends Record<string, {
    x: number;
    y: number;
}>>(coordinatesObj: T, factor?: number) => T;
export declare const COMMON_COORDINATES: {
    KEYBOARD_SWITCH: {
        x: number;
        y: number;
    };
    SHIFT_KEY: {
        x: number;
        y: number;
    };
    RETURN_KEY: {
        x: number;
        y: number;
    };
};
export declare const KEYBOARD_LAYOUT: Record<string, {
    x: number;
    y: number;
}>;
export declare const NUMPAD_LAYOUT: Record<string, {
    x: number;
    y: number;
}>;
