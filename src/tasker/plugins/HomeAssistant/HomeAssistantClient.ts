import { useCookies } from 'vue3-cookies'
const { cookies } = useCookies()
import * as homeassistant from '@brittonhayes/homeassistant-ts'
import type { HaEntity } from './types/HaEntity'
import type { HaService } from './types/HaService'

export class HomeAssistantClient {
    public client: homeassistant.Client
    public baseUrl: string = ''
    public accessToken: string = ''
    public pingStatus: boolean = false
    public error: string = ''
    public isRunning: boolean = false

    public constructor() {
        let defaultUrl = import.meta.env.VITE_HOMEASSISTANT_URL
        let defaultAccesstoken = import.meta.env.VITE_HOMEASSISTANT_TOKEN
        const cookieUrl = cookies.get('homeassistant_url')
        const cookieToken = cookies.get('homeassistant_token')

        if (cookieUrl && cookieUrl.length) {
            defaultUrl = cookieUrl
        }
        if (cookieToken && cookieToken.length) {
            defaultAccesstoken = cookieToken
        }

        this.baseUrl = defaultUrl
        this.accessToken = defaultAccesstoken

        this.client = this.createClient()
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

    public async getServices(): Promise<HaService[]> {
        this.isRunning = true
        const services = await this.client.services.list()
        const data: HaService[] = services.data as HaService[]
        this.isRunning = false

        return data
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

    // public async ping(): Promise<boolean> {
    //     this.isRunning = true
    //     const pingUrl = this.buildUrl('/api/')

    //     return fetch(pingUrl, this.getOptions('GET'))
    //         .then((res) => {
    //             this.isRunning = false
    //             if (!res.ok) {
    //                 this.pingStatus = false
    //                 this.error = res.statusText
    //                 if (res.status === 401) {
    //                     this.error = 'Unauthorized, check your access token'
    //                 }
    //                 return false
    //             } else {
    //                 this.pingStatus = true
    //                 this.error = ''
    //                 return true
    //             }
    //         })
    //         .catch((err) => {
    //             this.isRunning = false
    //             this.pingStatus = false
    //             this.error = err
    //             return false
    //         })
    // }

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
