import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import type BasePlugin from '@/tasker/plugins/BasePlugin'

export type SettingsFormComponent = {
    component: unknown
    props: { modelValue: BaseActionType; plugin: BasePlugin | null }
}
