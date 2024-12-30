import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import { EditStatusEnum } from './EditStatusEnum'
import type { ActiontypeFormComponent } from '@/tasker/ComponentTypes/ActiontypeFormComponent'
import type { PluginFormComponent } from '@/tasker/ComponentTypes/PluginFormComponent'
import type TaskerClient from '@/tasker/TaskerClient'
import { useTaskerClient } from '@/stores/useTaskerClient'
import { forEach } from 'lodash'
import { ActionTypeManager } from '@/tasker/helpers/ActionTypeManager'
import { computed, ref, watch, type Ref } from 'vue'
import type BasePlugin from '@/tasker/plugins/BasePlugin'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'
import type { SettingsFormComponent } from '@/tasker/ComponentTypes/SettingsFormComponent'
import router from '@/router'

export default class HomeViewState {
    private _editStatus = ref<EditStatusEnum>(EditStatusEnum.None)
    private taskerClient: TaskerClient
    private manager: ActionTypeManager
    private firstFetch = true

    public isBooting = ref<boolean>(true)
    public content_height = '300px'
    public currentAction = ref<BaseActionType | null>(null)
    public currentPluginIndex = ref<number | null>(null)
    public isRefreshing = ref<boolean>(false)
    public actionTypeRows = ref<BaseActionType[]>([])
    public actionTypeFormComponent = ref<ActiontypeFormComponent | null>(null)
    public pluginFormComponent = ref<PluginFormComponent | null>(null)
    public settingsFormComponent = ref<SettingsFormComponent | null>(null)
    public newBasePlugin = ref<BasePlugin | null>(null)
    public newBaseActionType = ref<BaseActionType | null>(null)
    public showSettings = ref<boolean>(false)
    public showNewTaskModal = ref<boolean>(false)
    public pickVariable = ref<boolean>(false)

    public urlParams = ref<{
        edit: number | null
        plugin: string | null
        add: number | null
    }>({
        edit: null,
        plugin: null,
        add: null,
    })

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

    constructor() {
        this.taskerClient = useTaskerClient().taskerClient
        this.manager = new ActionTypeManager()

        watch(
            () => this.taskerClient.isRunning,
            async (value) => {
                if (
                    this.actionTypeRows.value.length === 0 &&
                    !value &&
                    this.isBooting.value &&
                    this.firstFetch
                ) {
                    this.firstFetch = false
                    await this.initActions()
                    this.isBooting.value = false
                }
            },
        )
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
            if (!this.manager.loaded) {
                await this.manager.loadPlugins()
                await this.manager.loadForms()
                this.manager.loaded = true
            }
            this.actionTypeRows.value = []
            forEach(actions, async (action, index) => {
                const baseActionType = this.manager.getFormForAction(action)
                if (baseActionType != null) {
                    baseActionType.index = index
                    this.actionTypeRows.value.push(baseActionType)
                }
            })
        } else {
        }
    }

    setEditAction = async (actionIndex: number, pluginName: string | null = null) => {
        const action = this.actionTypeRows.value[actionIndex]

        if (action != null) {
            this.content_height = action.content_height
            this.currentAction.value = action
            this.actionTypeFormComponent.value = await action.getFormComponent()
            this.settingsFormComponent.value = await action.getSettingsFormComponent(pluginName)
            this.editStatus = EditStatusEnum.EditAction
            if (pluginName !== null) {
                const plugin = action.getPlugin(pluginName)
                if (plugin) {
                    this.pluginFormComponent.value = await plugin.getFormComponent()
                    this.actionTypeFormComponent.value = null
                    this.editStatus = EditStatusEnum.EditPlugin
                }
            } else {
                if (action) {
                    this.actionTypeFormComponent.value = await action.getFormComponent()
                    this.pluginFormComponent.value = null
                    this.editStatus.value = EditStatusEnum.EditAction
                }
            }
        }
    }

    createNewAction = async (code: number, pluginName: string | null = null) => {
        forEach(this.taskerClient.actionSpecs, async (actionSpec) => {
            if (actionSpec.code === code) {
                const newAction = actionSpec.createAction()
                this.newBaseActionType.value = this.manager.getFormForAction(newAction)
                if (this.newBaseActionType.value != null) {
                    this.actionTypeFormComponent.value =
                        await this.newBaseActionType.value.getFormComponent()
                    this.editStatus = EditStatusEnum.AddAction
                    this.pluginFormComponent.value = null
                    this.currentAction.value = this.newBaseActionType.value
                    this.content_height = this.newBaseActionType.value.content_height

                    if (pluginName !== null) {
                        const plugin = this.manager.createNewPlugin(
                            this.newBaseActionType.value,
                            pluginName,
                        )

                        if (plugin) {
                            this.pluginFormComponent.value = await plugin.getFormComponent()
                            this.actionTypeFormComponent.value = null
                            this.editStatus = EditStatusEnum.AddPlugin
                            this.content_height = plugin.content_height
                        }
                    }
                }
            }
        })
    }

    setUrlParams = (params: { edit: number | null; plugin: string | null; add: number | null }) => {
        this.urlParams.value = params
    }

    refresh = async () => {
        this.isRefreshing.value = true
        this.editStatus = EditStatusEnum.None
        await this.initActions()
        this.isRefreshing.value = false
        this.showSettings.value = false

        // if the current route query edit or plugin are set, push the route to the same page without the query
        if (
            this.urlParams.value.edit !== null ||
            this.urlParams.value.plugin !== null ||
            this.urlParams.value.add !== null
        ) {
            router.push({ query: {} })
        }
    }
}
