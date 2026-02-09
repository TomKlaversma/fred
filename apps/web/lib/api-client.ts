const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Custom fetch instance for Orval-generated API client.
 *
 * This function is referenced by the Orval config as the custom mutator.
 * Orval will call this function for every API request it generates.
 */
export const customInstance = async <T>({
  url,
  method,
  params,
  data,
  headers,
}: {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, string>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}): Promise<T> => {
  const queryString = params
    ? `?${new URLSearchParams(params).toString()}`
    : "";

  const response = await fetch(`${BASE_URL}${url}${queryString}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};
