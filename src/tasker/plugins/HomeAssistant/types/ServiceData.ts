export default class ServiceData {
    is_service: boolean = false
    baseUrl: string = ''
    apiActionUrl: string = ''
    domain: string | null = null
    service: string | null = null
    entity_id: string | null = null
    data: Record<string, string> | null = null

    setEntityId(entity_id: string) {
        this.entity_id = entity_id
    }

    setService(service: string) {
        this.service = service
    }

    setDomain(domain: string) {
        this.domain = domain
    }
}
