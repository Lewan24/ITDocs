/// <reference types="vite/client" />
declare global {
    interface Window {
        __ENV__?: {
            API_BASE_URL?: string;
        };
    }
}

export {};