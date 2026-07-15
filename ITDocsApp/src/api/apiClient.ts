const API_URL = "/api";

export interface ApiResponse<T> {
    status: number
    ok: boolean
    data?: T
    error?: string
}

async function request<T>(
    url: string,
    options: RequestInit
): Promise<ApiResponse<T>> {
    const token = localStorage.getItem("token");

    const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
    };

    const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
    });

    const contentType = response.headers.get("content-type");

    let data: any = null;

    if (contentType?.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        return {
            status: response.status,
            ok: false,
            error: data?.message ?? data ?? "Unknown error"
        };
    }

    return {
        status: response.status,
        ok: true,
        data
    };
}

export const api = {

    get: <T>(url: string) =>
        request<T>(url, {method: "GET"}),

    post: <T>(url: string, body: any) =>
        request<T>(url, {
            method: "POST",
            body: JSON.stringify(body)
        }),

    put: <T>(url: string, body: any) =>
        request<T>(url, {
            method: "PUT",
            body: JSON.stringify(body)
        }),

    delete: <T>(url: string) =>
        request<T>(url, {
            method: "DELETE"
        })
};