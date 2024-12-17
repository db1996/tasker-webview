import { ActionTypeSupportedType } from '../enums/ActionTypeSupportedType'
import type Action from '../types/Action'
import type { ActiontypeFormComponent } from '../ComponentTypes/ActiontypeFormComponent'
import type BasePlugin from './../plugins/BasePlugin'
import { markRaw } from 'vue'
import DefaultForm from './default/DefaultForm.vue'
import { forEach } from 'lodash'
import type { SettingsFormComponent } from '../ComponentTypes/SettingsFormComponent'

export default class BaseActionType {
    markRawSettings: unknown | null = null
    supported_plugins: Array<BasePlugin> = []
    tasker_name: string = ''
    tasker_code: number = 0
    name: string = ''
    modal_width: string = 'col-md-8'
    action: Action
    index: number = 0
    content_height: string = '300px'

    supportedType: ActionTypeSupportedType = ActionTypeSupportedType.DEFAULT
    show_args: boolean = true
    description: string = ''
    loaded_plugins: boolean = false

    // Always run this super in the constructor of the child class first. This will set the action and the tasker_name and tasker_code
    constructor(action: Action) {
        this.action = action
        this.tasker_name = action.name
        this.tasker_code = action.code
    }

    // If the action is supported by this type. By default it will check the tasker_code and tasker_name, the first actiontype to get recognized gets the job
    canHandle(): boolean {
        return this.action.code === this.tasker_code && this.action.name === this.tasker_name
    }

    // return a promise with the form component vue file
    getFormComponent(): Promise<ActiontypeFormComponent> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw(DefaultForm)))
    }

    // return a promise with the form component vue file
    getSettingsFormComponent(
        pluginIndex: number | null = null,
    ): Promise<SettingsFormComponent | null> {
        if (this.markRawSettings !== null) {
            return Promise.resolve(
                this.buildSettingsFormComponentEntry(this.markRawSettings, pluginIndex),
            )
        }
        return Promise.resolve(null)
    }

    // Do not override this, this will build the form component entry, it is required to be ActiontypeFormComponent
    buildFormComponentEntry(markRawComponent: unknown): ActiontypeFormComponent {
        return {
            component: markRawComponent,
            props: { modelValue: this },
        }
    }

    // Do not override this, this will build the form component entry, it is required to be SettingsFormComponent
    buildSettingsFormComponentEntry(
        markRawComponent: unknown,
        pluginIndex: number | null = null,
    ): SettingsFormComponent | null {
        let plugin: BasePlugin | null = null
        if (pluginIndex !== null && this.supported_plugins[pluginIndex] !== null) {
            plugin = this.supported_plugins[pluginIndex] as BasePlugin
        }

        return {
            component: markRawComponent,
            props: { modelValue: this, plugin: plugin },
        }
    }

    // Will be called when the form in the modal is submitted
    submitForm(values: object): boolean {
        forEach(values, (value, key) => {
            const expl = key.split('_')
            forEach(this.action.args, (arg) => {
                if (arg.id === parseInt(expl[1])) {
                    arg.value = value
                }
            })
        })
        return true
    }

    submitDefaultSettingsForm(values: { label: string | null }): boolean {
        if (values.label !== null) {
            this.action.label = values.label
        }
        return true
    }

    // Will be called before saving the action, set all the args on this.actiontype.args here
    setArgs() {}
}
