import PopupForm from './PopupForm.vue'
import { markRaw } from 'vue'
import BaseActionType from '@/tasker/actionTypes/BaseActionType'
import type { ActiontypeFormComponent } from '@/tasker/ComponentTypes/ActiontypeFormComponent'
import type Action from '@/tasker/types/Action'
import { ActionTypeSupportedType } from '@/tasker/enums/ActionTypeSupportedType'

export default class PopupActionType extends BaseActionType {
    tasker_code: number = 550
    tasker_name: string = 'Popup'
    name: string = 'Popup'
    message: string = ''
    show_args: boolean = false
    content_height: string = '100px'
    supportedType: ActionTypeSupportedType = ActionTypeSupportedType.CUSTOM

    constructor(action: Action) {
        super(action)
    }

    canHandle(): boolean {
        if (this.action.code === this.tasker_code && this.action.name === this.tasker_name) {
            this.message = this.action.args[1].value.toString()
            this.description = 'Message: ' + this.message
            return true
        }

        return false
    }

    getFormComponent(): Promise<ActiontypeFormComponent> {
        return Promise.resolve(this.buildFormComponentEntry(markRaw(PopupForm)))
    }

    submitForm(values: { message: string | null }): boolean {
        this.message = values.message || ''
        return true
    }

    setArgs(): void {
        this.action.args[1].value = this.message
    }
}
