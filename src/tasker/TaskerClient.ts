import { useCookies } from 'vue3-cookies'
import Action from './types/Action'
import { taskerStoreError } from './enums/taskerStoreError'
import { cloneDeep, forEach } from 'lodash'
import type BaseActionType from './types/BaseActionType'

const { cookies } = useCookies()

export default class TaskerClient {
    url: string = ''
    ping: boolean = false
    error: taskerStoreError = taskerStoreError.NONE
    isRunning: boolean = false

    public constructor() {
        let defaultUrl = import.meta.env.VITE_TASKER_URL
        const cookieUrl = cookies.get('tasker_url')

        if (cookieUrl && cookieUrl.length) {
            defaultUrl = cookieUrl
        }

        this.url = defaultUrl

        if (this.url.length === 0) {
            this.error = taskerStoreError.NO_URL
        }
    }

    async setUrl(url: string) {
        this.url = url.endsWith('/') ? url.slice(0, -1) : url
        await this.pingTasker()
    }

    async pingTasker() {
        this.ping = false

        try {
            const actions = await this.getActions()
            if (actions !== null) {
                this.ping = true
                this.error = taskerStoreError.OK
            }

            if (!this.ping) {
                this.error = taskerStoreError.NO_CONNECT
            }
            this.isRunning = false
        } catch (e) {
            console.log('error caught', e)

            this.error = taskerStoreError.NO_CONNECT
            this.isRunning = false
            this.ping = false
        }
    }

    async getActions(): Promise<Array<Action> | null> {
        this.isRunning = true
        try {
            const response = await fetch(this.url + '/actions')
            // const data = await response.json()
            // deserialize the response to an array of Action objects
            const actions: Array<Action> = await response.json()
            this.isRunning = false
            if (!Array.isArray(actions)) {
                return null
            }

            forEach(actions, (action, index) => {
                action.index = index
            })
            return actions
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            this.error = taskerStoreError.NO_CONNECT
            return null
        }
    }

    async moveAction(fromIndex: number, toIndex: number) {
        this.isRunning = true
        const urlParams = new URLSearchParams({
            from: fromIndex.toString(),
            to: toIndex.toString(),
        })
        const tUrl = this.buildUrl('/move', urlParams)
        const response = await fetch(tUrl, this.getOptions('GET'))

        try {
            const data = await response.json()
            forEach(data, (action) => {
                if (action.index === fromIndex) {
                    action.index = toIndex
                } else if (action.index === toIndex) {
                    action.index = fromIndex
                }
            })
            this.isRunning = false
            return data
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            return null
        }
    }

    async replaceAction(actionType: BaseActionType) {
        this.isRunning = true
        actionType.setArgs()
        const tempActionType = this.formatActionSave(actionType)

        const tUrl = this.buildUrl('/actions')
        const response = await fetch(
            tUrl,
            this.getOptions('PUT', { action: tempActionType.action, index: tempActionType.index }),
        )

        try {
            const data = await response.json()
            this.isRunning = false
            return data
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            return null
        }
    }

    async insertActionLast(actionType: BaseActionType) {
        this.isRunning = true
        actionType.setArgs()
        const tempActionType = this.formatActionSave(actionType)

        const tUrl = this.buildUrl('/actions')
        const response = await fetch(
            tUrl,
            this.getOptions('PATCH', {
                action: tempActionType.action,
                index: tempActionType.index,
            }),
        )

        try {
            const data = await response.json()
            this.isRunning = false
            return data
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            return null
        }
    }

    async deleteAction(index: number) {
        this.isRunning = true
        try {
            const urlParams = new URLSearchParams({
                index: index.toString(),
            })
            const tUrl = this.buildUrl('/delete', urlParams)
            const response = await fetch(tUrl, this.getOptions('GET'))
            if (response.status === 200) {
                this.error = taskerStoreError.OK
                this.isRunning = false
                return true
            }
        }
        catch (e) {
            console.log('error caught', e)
            this.error = taskerStoreError.NO_CONNECT
            this.isRunning = false
            return false
        }
    }

    async replaceAllActions(actionsTypes: Array<BaseActionType>) {
        // loop through the actions and replace them one by one
        for (let i = 0; i < actionsTypes.length; i++) {
            const actionType = actionsTypes[i]
            const response = await this.replaceAction(actionType)
            if (response === null) {
                return null
            }
        }
    }

    public buildUrl(path: string, params: URLSearchParams | null = null): string {
        if (params) {
            return this.url + path + '?' + params.toString()
        }
        return this.url + path
    }

    public getOptions(fetchMethod = 'GET', body: object | null = null): RequestInit {
        const myHeaders = new Headers()
        let rawBody = ''

        const requestOptions: RequestInit = {
            method: fetchMethod,
            headers: myHeaders,
            redirect: 'follow',
        }

        if (body) {
            myHeaders.append('Content-Type', 'application/json')
            rawBody = JSON.stringify(body)

            requestOptions.body = rawBody
        }

        return requestOptions
    }

    public formatActionSave(action: BaseActionType): BaseActionType {
        const actionType = cloneDeep(action)
        forEach(actionType.action.args, (arg) => {
            if (typeof arg.value === 'number') {
                arg.value = arg.value.toString()
            }
        })

        return actionType
    }
}
