import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import { EditStatusEnum } from './EditStatusEnum'
import type { ActiontypeFormComponent } from '@/tasker/actionTypes/ActiontypeFormComponent'
import type { PluginFormComponent } from '@/tasker/plugins/PluginFormComponent'
import type TaskerClient from '@/tasker/TaskerClient'
import { useTaskerClient } from '@/stores/useTaskerClient'
import { forEach } from 'lodash'
import { ActionTypeManager } from '@/tasker/helpers/ActionTypeManager'
import { computed, ref, type Ref } from 'vue'
import type BasePlugin from '@/tasker/plugins/BasePlugin'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'

export default class HomeViewState {
    public isRefreshing = ref<boolean>(false)
    public actionTypeRows = ref<BaseActionType[]>([])
    public actionTypeFormComponent = ref<ActiontypeFormComponent | null>(null)
    public pluginFormComponent = ref<PluginFormComponent | null>(null)
    public newBasePlugin = ref<BasePlugin | null>(null)

    public taskerStatus = computed(() => {
        const ret = {
            text: 'Up to date',
            text_class: 'text-success',
            icon: 'check',
            spin: false,
            tooltip: '',
        }
        switch (this.taskerClient.taskerClientStatus) {
            case TaskerClientStatus.RETRIEVE:
                ret.text = 'Retrieving tasks'
                ret.icon = 'progress-download'
                ret.text_class = 'text-warning'
                break
            case TaskerClientStatus.UPLOAD:
                ret.text = 'Uploading tasks'
                ret.icon = 'progress-upload'
                ret.text_class = 'text-warning'
                break
            case TaskerClientStatus.ERROR:
                ret.text = 'Error'
                ret.text_class = 'text-danger'
                ret.icon = 'alert'
                ret.tooltip = this.taskerClient.error
                break

            default:
                break
        }
        return ret
    })

    private _editStatus = ref<EditStatusEnum>(EditStatusEnum.None)
    private taskerClient: TaskerClient
    private manager: ActionTypeManager
    // a boolean prop with a setter function

    constructor() {
        this.taskerClient = useTaskerClient().taskerClient
        this.manager = new ActionTypeManager()
    }

    public set editStatus(value: EditStatusEnum) {
        if (value === EditStatusEnum.None) {
            this.actionTypeFormComponent.value = null
            this.pluginFormComponent.value = null
        }

        this._editStatus.value = value
    }

    public get editStatus(): Ref<EditStatusEnum, EditStatusEnum> {
        return this._editStatus
    }

    initActions = async () => {
        const actions = await this.taskerClient.getActions()
        if (actions != null) {
            await this.manager.loadPlugins()
            await this.manager.loadForms()
            this.actionTypeRows.value = []
            forEach(actions, async (action, index) => {
                const baseActionType = this.manager.getFormForAction(action)
                if (baseActionType != null) {
                    baseActionType.index = index
                    this.actionTypeRows.value.push(baseActionType)
                }
            })
        } else {
            this.actionTypeRows.value = []
        }
    }

    refresh = async () => {
        this.isRefreshing.value = true
        this.editStatus = EditStatusEnum.None
        await this.initActions()
        this.isRefreshing.value = false
    }
}
