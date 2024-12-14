import type BasePlugin from '@/tasker/plugins/BasePlugin'

export type PluginFormComponent = {
    component: unknown
    props: { modelValue: BasePlugin }
}
