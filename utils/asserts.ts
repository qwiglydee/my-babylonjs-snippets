import type { Nullable } from "@babylonjs/core/types";

export function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) throw new Error(message ?? "Assertion failed");
}

export function assertNonNull<T>(value: Nullable<T>, message?: string): asserts value is NonNullable<T> {
    if (value == null || value === undefined) throw new Error(message ?? "NonNull assertion failed");
}
