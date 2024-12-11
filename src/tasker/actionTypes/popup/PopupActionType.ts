import PopupForm from './PopupForm.vue'
import { markRaw } from 'vue'
import BaseActionType from '@/tasker/actionTypes/BaseActionType'
import type { ActiontypeFormComponent } from '@/tasker/actionTypes/ActiontypeFormComponent'
import type Action from '@/tasker/types/Action'

export default class PopupActionType extends BaseActionType {
    tasker_code: number = 550
    tasker_name: string = 'Popup'
    name: string = 'Popup'
    modal_width: string = ''
    message: string = ''

    constructor(action: Action) {
        super(action)
        this.message = this.action.args[1].value.toString()
        this.description = 'Message: ' + this.message
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
