export type HaService = {
    name?: string | undefined
    description?: string | undefined
    fields?: Record<string, unknown>[] | undefined
    target?: Record<string, unknown> | undefined
}
