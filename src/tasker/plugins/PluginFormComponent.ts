import type BasePlugin from './BasePlugin'

export type PluginFormComponent = {
    component: unknown
    props: { modelValue: BasePlugin }
}
