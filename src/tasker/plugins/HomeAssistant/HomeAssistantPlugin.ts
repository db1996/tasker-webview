import { markRaw } from 'vue'
import HomeAssistantEdit from './Components/HomeAssistantEdit.vue'
import BaseActionType from '@/tasker/actionTypes/BaseActionType'
import BasePlugin from '@/tasker/plugins/BasePlugin'
import type { PluginFormComponent } from '@/tasker/plugins/PluginFormComponent'
import { HomeAssistantClient } from './HomeAssistantClient'
import ServiceData from './types/ServiceData'
import { forEach } from 'lodash'
import HttpRequestActionType from '@/tasker/actionTypes/HttpRequest/HttpRequestActionType'
import { MethodType } from '@/tasker/actionTypes/HttpRequest/helpers/MethodType'

export default class HomeAssistantPlugin extends BasePlugin {
    realActionType: HttpRequestActionType | null = null
    name: string = 'Home Assistant'
    icon: string = 'home-assistant'
    modal_width: string = 'lg'

    client: HomeAssistantClient = new HomeAssistantClient()
    serviceData: ServiceData = new ServiceData()

    static taskerReplaceUrl: string = ''
    static taskerReplaceToken: string = ''

    constructor(actionType: BaseActionType) {
        super(actionType)

        if (HomeAssistantPlugin.taskerReplaceUrl === '') {
            let envToken = import.meta.env.VITE_HOMEASSISTANT_TASKER_TOKEN
            if (typeof envToken !== 'string' || envToken.length === 0) {
                envToken = this.client.accessToken
            }
            HomeAssistantPlugin.taskerReplaceToken = envToken

            let taskerReplaceUrl = import.meta.env.VITE_HOMEASSISTANT_TASKER_URL
            if (typeof taskerReplaceUrl !== 'string' || taskerReplaceUrl.length === 0) {
                taskerReplaceUrl = this.client.baseUrl
            }
            HomeAssistantPlugin.taskerReplaceUrl = taskerReplaceUrl
        }
    }

    canHandle(): boolean {
        if (this.actionType.name === 'HTTP Request') {
            const actionType = this.actionType as HttpRequestActionType
            if (
                actionType.params.method_type === MethodType.POST &&
                ((HomeAssistantPlugin.taskerReplaceUrl !== '' &&
                    actionType.params.url.startsWith(HomeAssistantPlugin.taskerReplaceUrl)) ||
                    actionType.params.url.startsWith(this.client.baseUrl))
            ) {
                const body = JSON.parse(actionType.params.body)
                this.serviceData = HomeAssistantPlugin.urlToServiceData(actionType.params.url, body)

                if (this.serviceData.is_service) {
                    const realActionType = this.actionType as HttpRequestActionType
                    this.realActionType = realActionType
                    return true
                }
            }
        }
        return false
    }

    getFormComponent(): Promise<PluginFormComponent> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw(HomeAssistantEdit)))
    }

    submitForm(values: {
        domain: string
        service: string
        entity: string
        data: string
        timeout?: number
        trust_any_certificate?: boolean
        follow_redirects?: boolean
        use_cookies?: boolean
        structure_output?: boolean
    }): boolean {
        this.serviceData.domain = values.domain
        this.serviceData.service = values.service
        this.serviceData.entity_id = values.entity
        if (values.data !== '') {
            try {
                this.serviceData.data = JSON.parse(values.data)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                this.serviceData.data = null
            }
        } else {
            this.serviceData.data = null
        }
        if (this.realActionType !== null) {
            if (values.hasOwnProperty('timeout')) {
                this.realActionType.params.timeout = values.timeout as number
            }
            if (values.hasOwnProperty('trust_any_certificate')) {
                this.realActionType.params.trust_any_certificate =
                    values.trust_any_certificate as boolean
            }
            if (values.hasOwnProperty('follow_redirects')) {
                this.realActionType.params.follow_redirects = values.follow_redirects as boolean
            }
            if (values.hasOwnProperty('use_cookies')) {
                this.realActionType.params.use_cookies = values.use_cookies as boolean
            }
            if (values.hasOwnProperty('structure_output')) {
                this.realActionType.params.structure_output = values.structure_output as boolean
            }
        }

        return true
    }

    setArgs(): void {
        const actionType = this.actionType as HttpRequestActionType

        let url = this.client.buildUrl(
            '/api/services/' + this.serviceData.domain + '/' + this.serviceData.service,
        )

        url = url.replace(this.client.baseUrl, HomeAssistantPlugin.taskerReplaceUrl)

        this.setHeaders()

        actionType.params.url = url
        actionType.params.method_type = MethodType.POST
        actionType.params.body = JSON.stringify({
            entity_id: this.serviceData.entity_id,
            ...this.serviceData.data,
        })

        this.actionType.setArgs()
    }

    setHeaders() {
        const actionType = this.actionType as HttpRequestActionType
        actionType.params.headers = [
            {
                key: 'Authorization',
                value: 'Bearer ' + HomeAssistantPlugin.taskerReplaceToken,
            },
        ]
    }

    static urlToServiceData(url: string, body: object | null = null): ServiceData {
        const client: HomeAssistantClient = new HomeAssistantClient()
        const urlServiceData = new ServiceData()

        if (
            !url.startsWith(HomeAssistantPlugin.taskerReplaceUrl) &&
            !url.startsWith(client.baseUrl)
        ) {
            return urlServiceData
        }

        url.replace(HomeAssistantPlugin.taskerReplaceUrl, client.baseUrl)

        url = url.replace('http://', '').replace('https://', '')

        const urlParts = url.split('/')
        urlServiceData.baseUrl = urlParts[0]

        if (urlParts.length >= 3) {
            urlServiceData.apiActionUrl = urlParts[1] + '/' + urlParts[2]
            if (urlParts[2] === 'services' && urlParts.length >= 5) {
                urlServiceData.is_service = true
                urlServiceData.domain = urlParts[3]
                urlServiceData.service = urlParts[4]

                if (body !== null) {
                    const data: { [key: string]: unknown } = {}
                    forEach(body, (value, key) => {
                        if (key === 'entity_id') {
                            urlServiceData.entity_id = value
                        } else {
                            data[key] = value
                        }
                    })
                    if (Object.keys(data).length > 0) urlServiceData.data = data
                }
            }
        }

        return urlServiceData
    }

    static createNewAction() {
        const actionType = HttpRequestActionType.createNewAction()

        return new HomeAssistantPlugin(actionType)
    }
}
