import Action from './types/Action'
import { taskerStoreError } from './enums/taskerStoreError'
import { cloneDeep, forEach } from 'lodash'
import type BaseActionType from './actionTypes/BaseActionType'
import { TaskerClientStatus } from './enums/TaskerClientStatus'
import type { ActionSpec } from './types/specs/ActionSpec'

export default class TaskerClient {
    url: string = ''
    ping: boolean = false
    error: taskerStoreError = taskerStoreError.NONE
    taskerClientStatus: TaskerClientStatus = TaskerClientStatus.NONE
    isRunning: boolean = false

    actionSpecs: Array<ActionSpec> = []

    public constructor() {
        this.url = import.meta.env.VITE_TASKER_URL

        if (this.url.length === 0) {
            this.error = taskerStoreError.NO_URL
            this.taskerClientStatus = TaskerClientStatus.ERROR
        }
    }

    async setUrl(url: string) {
        this.url = url.endsWith('/') ? url.slice(0, -1) : url
        await this.pingTasker()
    }

    async pingTasker() {
        this.ping = false
        this.isRunning = true

        this.taskerClientStatus = TaskerClientStatus.RETRIEVE
        try {
            const response = await fetch(this.url + '/ping')
            const text = await response.text()
            if (text !== '{}') {
                this.error = taskerStoreError.NO_CONNECT
                this.isRunning = false
                this.ping = false
                return
            }

            this.error = taskerStoreError.OK
            this.isRunning = false
            this.ping = true
        } catch (e) {
            console.log('error caught', e)

            this.error = taskerStoreError.NO_CONNECT
            this.isRunning = false
            this.ping = false
        }
    }

    async getActionSpecs(): Promise<Array<ActionSpec> | null> {
        this.isRunning = true
        this.taskerClientStatus = TaskerClientStatus.RETRIEVE
        try {
            const response = await fetch(this.url + '/action_specs')
            const actionSpecs: Array<ActionSpec> = await response.json()

            this.isRunning = false
            if (!Array.isArray(actionSpecs)) {
                this.taskerClientStatus = TaskerClientStatus.NONE
                return null
            }

            this.taskerClientStatus = TaskerClientStatus.NONE
            return actionSpecs
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            this.error = taskerStoreError.NO_CONNECT
            this.taskerClientStatus = TaskerClientStatus.ERROR
            return null
        }
    }

    async getActions(): Promise<Array<Action> | null> {
        if (this.isRunning) {
            return null
        }
        this.isRunning = true
        this.taskerClientStatus = TaskerClientStatus.RETRIEVE
        if (this.actionSpecs.length === 0) {
            const specs = await this.getActionSpecs()
            if (specs === null) {
                this.isRunning = false
                this.taskerClientStatus = TaskerClientStatus.ERROR
                return null
            }
            this.actionSpecs = specs
        }
        try {
            const response = await fetch(this.url + '/actions')
            // const data = await response.json()
            // deserialize the response to an array of Action objects
            const actions: Array<Action> = await response.json()
            if (!Array.isArray(actions)) {
                this.taskerClientStatus = TaskerClientStatus.NONE
                return null
            }

            forEach(actions, (action, index) => {
                forEach(this.actionSpecs, (spec) => {
                    if (spec.code === action.code) {
                        action.actionSpec = spec
                    }
                })
                action.index = index
            })
            this.isRunning = false
            this.taskerClientStatus = TaskerClientStatus.NONE
            return actions
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            this.error = taskerStoreError.NO_CONNECT
            this.taskerClientStatus = TaskerClientStatus.ERROR
            return null
        }
    }

    async moveAction(fromIndex: number, toIndex: number) {
        this.isRunning = true
        this.taskerClientStatus = TaskerClientStatus.UPLOAD
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
            this.taskerClientStatus = TaskerClientStatus.NONE
            return data
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            this.taskerClientStatus = TaskerClientStatus.ERROR
            return null
        }
    }

    async saveLabel(index: number, label: string) {
        this.isRunning = true
        this.taskerClientStatus = TaskerClientStatus.UPLOAD
        const urlParams = new URLSearchParams({
            index: index.toString(),
            value: label,
        })
        const tUrl = this.buildUrl('/label', urlParams)
        const response = await fetch(tUrl, this.getOptions('GET'))

        try {
            const data = await response.json()
            this.isRunning = false
            this.taskerClientStatus = TaskerClientStatus.NONE
            return data
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            this.taskerClientStatus = TaskerClientStatus.ERROR
            return null
        }
    }

    async replaceAction(actionType: BaseActionType) {
        this.isRunning = true
        this.taskerClientStatus = TaskerClientStatus.UPLOAD
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
            this.taskerClientStatus = TaskerClientStatus.NONE
            return data
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            this.taskerClientStatus = TaskerClientStatus.ERROR
            return null
        }
    }

    async insertActionLast(actionType: BaseActionType) {
        this.isRunning = true
        this.taskerClientStatus = TaskerClientStatus.UPLOAD
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
            this.taskerClientStatus = TaskerClientStatus.NONE
            return data
        } catch (e) {
            console.log('error caught', e)
            this.isRunning = false
            this.taskerClientStatus = TaskerClientStatus.ERROR
            return null
        }
    }

    async deleteAction(index: number): Promise<boolean> {
        this.isRunning = true
        this.taskerClientStatus = TaskerClientStatus.UPLOAD
        try {
            const urlParams = new URLSearchParams({
                index: index.toString(),
            })
            const tUrl = this.buildUrl('/delete', urlParams)
            const response = await fetch(tUrl, this.getOptions('GET'))
            this.taskerClientStatus = TaskerClientStatus.NONE
            if (response.status === 200) {
                this.error = taskerStoreError.OK
                this.isRunning = false
                return true
            }
        } catch (e) {
            console.log('error caught', e)
            this.error = taskerStoreError.NO_CONNECT
            this.isRunning = false
            this.taskerClientStatus = TaskerClientStatus.ERROR
            return false
        }

        return false
    }

    async replaceAllActions(actionsTypes: Array<BaseActionType>) {
        // loop through the actions and replace them one by one
        this.taskerClientStatus = TaskerClientStatus.UPLOAD
        for (let i = 0; i < actionsTypes.length; i++) {
            const actionType = actionsTypes[i]
            const response = await this.replaceAction(actionType)
            if (response === null) {
                this.taskerClientStatus = TaskerClientStatus.NONE
                return null
            }
        }
        this.taskerClientStatus = TaskerClientStatus.NONE
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
