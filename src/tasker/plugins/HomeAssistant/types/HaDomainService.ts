import type { HaService } from './HaService'

export type HaDomainService = {
    domain?: string | undefined
    services?: HaService[] | undefined
}
