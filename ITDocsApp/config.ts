export const config = {
    apiBaseUrl:
        window.__ENV__?.API_BASE_URL ??
        'https://localhost:7121/api',
} as const;