export type HaService = {
    domain?: string | undefined
    services?:
        | {
              name?: string | undefined
              description?: string | undefined
              fields?: Record<string, never> | undefined
              target?: Record<string, never> | undefined
          }[]
        | undefined
}
