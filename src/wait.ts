const MAX_TIMEOUT_MS = 2_147_483_647;

export async function wait(timeMs: number) {
    if (timeMs > MAX_TIMEOUT_MS) {
        await new Promise(resolve => setTimeout(resolve, MAX_TIMEOUT_MS));
        return wait(timeMs - MAX_TIMEOUT_MS);
    }

    return new Promise(resolve => setTimeout(resolve, timeMs));
}
