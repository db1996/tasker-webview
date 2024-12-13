import { ActionTypeSupportedType } from '../enums/ActionTypeSupportedType'
import type Action from '../types/Action'
import type { ActiontypeFormComponent } from './ActiontypeFormComponent'
import type BasePlugin from './../plugins/BasePlugin'
import { markRaw } from 'vue'
import DefaultForm from './default/DefaultForm.vue'
import { forEach } from 'lodash'

export default class BaseActionType {
    supported_plugins: Array<BasePlugin> = []
    tasker_name: string = ''
    tasker_code: number = 0
    name: string = ''
    modal_width: string = 'col-md-8'
    action: Action
    index: number = 0

    supportedType: ActionTypeSupportedType = ActionTypeSupportedType.CUSTOM
    show_args: boolean = true
    description: string = ''

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

    // Do not override this, this will build the form component entry, it is required to be ActiontypeFormComponent
    buildFormComponentEntry(markRawComponent: unknown): ActiontypeFormComponent {
        return {
            component: markRawComponent,
            props: { modelValue: this },
        }
    }

    // Will be called when the form in the modal is submitted
    submitForm(values: object): boolean {
        forEach(values, (value, key) => {
            forEach(this.action.args, (arg) => {
                if (arg.name === key) {
                    arg.value = value
                }
            })
        })
        return true
    }

    // Will be called before saving the action, set all the args on this.actiontype.args here
    setArgs() {}
}
