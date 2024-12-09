import DefaultForm from './DefaultForm.vue'
import { markRaw } from 'vue'
import BaseActionType from '@/tasker/types/BaseActionType'
import type { ActiontypeFormComponent } from '@/tasker/types/ActiontypeFormComponent'
import { ActionTypeSupportedType } from '@/tasker/enums/ActionTypeSupportedType'
import { forEach } from 'lodash'

export default class DefaultActionType extends BaseActionType {
    supportedType: ActionTypeSupportedType = ActionTypeSupportedType.DEFAULT
    show_args: boolean = true

    canHandle(): boolean {
        return true
    }

    getFormComponent(): Promise<ActiontypeFormComponent> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw(DefaultForm)))
    }

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
}
