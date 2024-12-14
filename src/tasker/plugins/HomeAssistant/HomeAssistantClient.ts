import * as homeassistant from '@brittonhayes/homeassistant-ts'
import type { HaEntity } from './types/HaEntity'
import type { HaDomainService } from './types/HaDomainService'
import { cloneDeep, forEach } from 'lodash'
import type { HaService } from './types/HaService'
import type { ActualService } from './types/ActualService'
import type { HaServiceField } from './types/HaServiceField'
import { HaServiceFieldType } from './enums/HaServiceFieldType'

export class HomeAssistantClient {
    public client: homeassistant.Client
    public baseUrl: string = ''
    public accessToken: string = ''
    public pingStatus: boolean = false
    public error: string = ''
    public isRunning: boolean = false

    private services: HaDomainService[] = []

    public constructor() {
        this.baseUrl = import.meta.env.VITE_HOMEASSISTANT_URL
        this.accessToken = import.meta.env.VITE_HOMEASSISTANT_TOKEN

        if (this.baseUrl.length === 0) {
            this.error = 'No URL'
        }

        if (this.accessToken.length === 0) {
            this.error = 'No Access Token'
        }

        this.client = this.createClient()
        this.getServices()
    }

    private createClient(): homeassistant.Client {
        const client = new homeassistant.Client({
            baseUrl: this.baseUrl,
            token: this.accessToken,
        })

        return client
    }

    public setUrl(url: string) {
        this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url
        this.client = this.createClient()
    }

    public setToken(token: string) {
        this.accessToken = token
        this.client = this.createClient()
    }

    public async ping(): Promise<boolean> {
        this.isRunning = true

        try {
            const result = await this.client.health.retrieve()

            if (result.status !== 200) {
                this.isRunning = false
                this.pingStatus = false
                if (result.data.message) {
                    this.error = result.data.message
                }
                if (result.status === 401) {
                    this.error = 'Unauthorized, check your access token'
                }

                return false
            }
        } catch (error) {
            this.isRunning = false
            this.pingStatus = false
            if (error) {
                this.error = "Can't connect to Home Assistant"
            }
            return false
        }

        this.isRunning = false
        this.pingStatus = true
        this.error = ''

        return true
    }

    public async getEntities(domain: string = ''): Promise<HaEntity[]> {
        this.isRunning = true
        const response = await this.client.states.list()
        let entities: HaEntity[] = response.data

        if (domain !== '') {
            entities = entities.filter((entity) => entity.entity_id?.startsWith(domain + '.'))
        }

        this.isRunning = false

        if (!entities) return []

        return entities
    }

    public async getEntity(entityId: string): Promise<HaEntity> {
        this.isRunning = true
        const entity = await this.client.states.retrieve(entityId)
        this.isRunning = false

        return entity.data
    }

    public async getServices(): Promise<HaDomainService[]> {
        if (this.services.length > 0) {
            return this.services
        }

        this.isRunning = true
        const services = this.client.services.list()
        services.then((data) => {
            const convertedData: HaDomainService[] = data.data as HaDomainService[]
            this.services = convertedData
        })
        this.isRunning = false

        return this.services
    }

    public async GetService(domain: string, service: string): Promise<ActualService | null> {
        const services = await this.getServices()
        let haService: HaService | null = null
        let actualService: ActualService | null = null
        if (services) {
            forEach(services, (domainServices) => {
                if (domainServices.domain === domain) {
                    forEach(domainServices.services, (serviceData, serviceId) => {
                        if (serviceId.toString() === service) {
                            haService = cloneDeep(serviceData) as HaService
                            actualService = {
                                id: serviceId.toString(),
                                name: serviceData.name,
                                description: serviceData.description,
                                type: domainServices.domain,
                                fields: [],
                            }
                        }
                    })
                }
            })
        }

        if (haService === null || actualService === null) {
            return Promise.resolve(null)
        }
        const serviceConst = haService as HaService

        if (serviceConst.fields !== undefined) {
            forEach(serviceConst.fields, (field, index) => {
                if (index.toString() !== 'advanced_fields') {
                    const fieldData = this.convertField(field, index.toString())

                    if (fieldData !== null) {
                        actualService?.fields.push(fieldData)
                    }
                }
            })
        }

        return Promise.resolve(actualService)
    }

    private convertField(field: Record<string, unknown>, id: string): HaServiceField | null {
        const fieldData: HaServiceField = {
            id: id,
        }

        if (field.name !== undefined) {
            fieldData.name = field.name as string
        }
        if (field.description !== undefined) {
            fieldData.description = field.description as string
        }
        if (field.required !== undefined) {
            fieldData.required = field.required as boolean
        }
        if (field.example !== undefined) {
            fieldData.example = field.example as string
        }

        if (fieldData.id == 'date' || fieldData.id == 'time' || fieldData.id == 'datetime') {
            fieldData.type = fieldData.id as HaServiceFieldType
        } else {
            if (field.selector !== undefined && field.type === undefined) {
                const selector = field.selector as Record<string, unknown>

                forEach(HaServiceFieldType, (value) => {
                    if (selector[value] !== undefined) {
                        const selectorValue = selector[value] as Record<string, unknown>

                        switch (value) {
                            case 'text':
                            case 'boolean':
                                fieldData.type = value
                                break
                            case 'entity':
                                fieldData.type = HaServiceFieldType.TEXT
                                break
                            case 'select':
                                fieldData.type = HaServiceFieldType.SELECT
                                fieldData.options = []
                                if (selectorValue !== null) {
                                    if (selectorValue.options !== undefined) {
                                        forEach(
                                            selectorValue.options,
                                            (option: string | { label: string; value: string }) => {
                                                if (typeof option === 'string') {
                                                    fieldData.options?.push({
                                                        label: option,
                                                        value: option,
                                                    })
                                                } else {
                                                    fieldData.options?.push({
                                                        label: option.label as string,
                                                        value: option.value as string,
                                                    })
                                                }
                                            },
                                        )
                                    }
                                }
                                break
                            case 'color_temp':
                            case 'color_rgb':
                            case 'number':
                                if (fieldData.type === undefined) {
                                    fieldData.type = HaServiceFieldType.NUMBER
                                }

                                if (selectorValue !== null) {
                                    if (selectorValue.min !== undefined) {
                                        fieldData.min = selectorValue.min as number
                                    }

                                    if (selectorValue.max !== undefined) {
                                        fieldData.max = selectorValue.max as number
                                    }

                                    if (selectorValue.unit_of_measurement !== undefined) {
                                        fieldData.unit_of_measurement =
                                            selectorValue.unit_of_measurement as string
                                    }
                                    if (selectorValue.unit !== undefined) {
                                        fieldData.unit_of_measurement = selectorValue.unit as string
                                    }
                                }

                                break
                        }
                    }
                })
            }
        }

        if (fieldData.type !== undefined) {
            return fieldData
        }

        return null
    }

    public async CallService(
        domain: string,
        service: string,
        entity_id: string,
        data: object | null = null,
    ): Promise<boolean> {
        this.isRunning = true

        const url = this.buildUrl('/api/services/' + domain + '/' + service)

        let body = { entity_id: entity_id }
        if (data) {
            body = { ...body, ...data }
        }

        const options = this.getOptions('POST', body)

        return await fetch(url, options)
            .then((res) => {
                this.isRunning = false
                if (!res.ok) {
                    this.error = res.statusText
                    if (res.status === 401) {
                        this.error = 'Unauthorized, check your access token'
                    }
                    return false
                } else {
                    this.error = ''

                    return true
                }
            })
            .catch((err) => {
                this.isRunning = false
                this.error = err
                return false
            })
    }

    public buildUrl(path: string, params: URLSearchParams | null = null): string {
        if (params) {
            return this.baseUrl + path + '?' + params.toString()
        }
        return this.baseUrl + path
    }

    public getOptions(fetchMethod = 'GET', body: object | null = null): RequestInit {
        const headers = new Headers()
        headers.append('Authorization', 'Bearer ' + this.accessToken)
        let rawBody = ''

        const requestOptions: RequestInit = {
            method: fetchMethod,
            headers: headers,
            redirect: 'follow',
        }

        if (body) {
            headers.append('Content-Type', 'application/json')
            rawBody = JSON.stringify(body)

            requestOptions.body = rawBody
        }

        return requestOptions
    }
}
