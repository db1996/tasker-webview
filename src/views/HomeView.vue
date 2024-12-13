<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { ActionTypeManager } from '@/tasker/helpers/ActionTypeManager'
import type { ActiontypeFormComponent } from '@/tasker/actionTypes/ActiontypeFormComponent'
import { computed, onMounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import MdiIcon from '@/components/MdiIcon.vue'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'
import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import { forEach } from 'lodash'
import ActionRow from '@/tasker/ActionRow.vue'
import type { PluginFormComponent } from '@/tasker/plugins/PluginFormComponent'
import HomeAssistantPlugin from '@/tasker/plugins/HomeAssistant/HomeAssistantPlugin'
import type BasePlugin from '@/tasker/plugins/BasePlugin'
import { useTaskerClient } from '@/stores/useTaskerClient'
import HomeViewState from '@/helpers/homeView/HomeViewState'
import router from '@/router'
import { useRoute } from 'vue-router'
import { EditStatusEnum } from '@/helpers/homeView/EditStatusEnum'

const taskerClient = useTaskerClient().taskerClient
const state = ref(<HomeViewState>new HomeViewState())
const taskerClientStatus = ref<TaskerClientStatus>(TaskerClientStatus.NONE)
const actionForm = ref()
const pluginForm = ref()
const actionModalComponent = ref<ActiontypeFormComponent | null>(null)
const pluginModalComponent = ref<PluginFormComponent | null>(null)
const actionSettingForm = ref(false)
const newPluginType = ref<BasePlugin | null>(null)
const route = useRoute()

watch(
    () => route.query.edit, // Use a function to track `route.query.edit`
    async () => checkEditParam(),
)

async function checkEditParam(refreshNoEdit: boolean = true) {
    console.log('checkEditParam', urlParams.value.edit, urlParams.value.plugin)

    if (urlParams.value.edit !== null) {
        const actionIndex = urlParams.value.edit
        const pluginIndex = urlParams.value.plugin
        const action = state.value.actionTypeRows[actionIndex]
        if (pluginIndex !== null) {
            const typeFormComponentEntry: PluginFormComponent =
                await state.value.actionTypeRows[actionIndex].supported_plugins[
                    pluginIndex
                ].getFormComponent()

            pluginModalComponent.value = typeFormComponentEntry
            actionModalComponent.value = null
            state.value.editStatus = EditStatusEnum.EditPlugin
        } else {
            if (action) {
                actionModalComponent.value = await action.getFormComponent()
                pluginModalComponent.value = null
                state.value.editStatus = EditStatusEnum.EditAction
            }
        }
    } else {
        if (refreshNoEdit) {
            await refresh()
        }
    }
}

const urlParams = computed(() => {
    const params: { edit: number | null; plugin: number | null } = { edit: null, plugin: null }

    if (route.query.plugin !== undefined && route.query.plugin !== null) {
        params.plugin = parseFloat(route.query.plugin as string)
    }
    if (route.query.edit !== undefined && route.query.edit !== null) {
        params.edit = parseFloat(route.query.edit as string)
    }
    return params
})

onMounted(async () => {
    await refresh()
    await checkEditParam(false)
    state.value.isBooting = false
})

async function refresh() {
    // reload entire page
    if (!state.value.isRefreshing) {
        state.value = new HomeViewState()
        state.value.isRefreshing = true
        actionModalComponent.value = null
        pluginModalComponent.value = null
        await initActions()
    }

    state.value.isRefreshing = false
}

async function initActions() {
    taskerClientStatus.value = TaskerClientStatus.RETRIEVE

    const actions = await taskerClient.getActions()
    if (actions != null) {
        const manager = new ActionTypeManager()
        await manager.loadPlugins()
        await manager.loadForms()
        state.value.actionTypeRows = []
        forEach(actions, async (action, index) => {
            const baseActionType = manager.getFormForAction(action)
            if (baseActionType != null) {
                baseActionType.index = index
                state.value.actionTypeRows.push(baseActionType)
            }
        })
        taskerClientStatus.value = TaskerClientStatus.NONE
    } else {
        state.value.actionTypeRows = []
        taskerClientStatus.value = TaskerClientStatus.ERROR
    }
}

function randomKey() {
    return Math.random().toString(36).substring(7)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reorderAction(event: any) {
    if (event.newIndex !== event.oldIndex) {
        taskerClientStatus.value = TaskerClientStatus.UPLOAD
        await taskerClient.moveAction(event.oldIndex, event.newIndex)
        await refresh()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function submitBaseAction(FormData: any, form$: any) {
    const data = form$.data
    const actionType = actionModalComponent.value?.props.modelValue as BaseActionType
    if (actionType) {
        const resp = actionType.submitForm(data)
        if (resp) {
            await taskerClient.replaceAction(actionType)
        }
    }
    router.push({ query: {} })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function submitPlugin(FormData: any, form$: any) {
    const data = form$.data
    if (
        state.value.editStatus == EditStatusEnum.EditPlugin &&
        urlParams.value.edit !== null &&
        urlParams.value.plugin !== null
    ) {
        const actionType = state.value.actionTypeRows[urlParams.value.edit]
        if (actionType) {
            const plugin = actionType.supported_plugins[urlParams.value.plugin]
            const resp = plugin.submitForm(data)
            if (resp) {
                plugin.setArgs()
                await taskerClient.replaceAction(plugin.actionType)
                await refresh()
            }
        }
    } else if (state.value.editStatus == EditStatusEnum.AddPlugin && newPluginType.value !== null) {
        newPluginType.value.submitForm(data)
        newPluginType.value.setArgs()
        await taskerClient.insertActionLast(newPluginType.value.actionType)
    }
    router.push({ query: {} })
}

const taskerStatus = computed(() => {
    const ret = {
        text: 'Up to date',
        text_class: 'text-success',
        icon: 'check',
        spin: false,
        tooltip: '',
    }
    switch (taskerClientStatus.value) {
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
            ret.tooltip = taskerClient.error
            break

        default:
            break
    }
    return ret
})

async function newHomeAssistantTask() {
    newPluginType.value = HomeAssistantPlugin.createNewAction()
    state.value.editStatus = EditStatusEnum.AddPlugin

    const typeFormComponentEntry: PluginFormComponent = await newPluginType.value.getFormComponent()
    pluginModalComponent.value = typeFormComponentEntry
}

async function deleteAction(index: number) {
    taskerClientStatus.value = TaskerClientStatus.UPLOAD
    await taskerClient.deleteAction(index)
    await refresh()
}

async function openIndex(index: number) {
    // go to same page with edit query parameter and remount
    await router.push({ query: { edit: index } })
}
</script>

<template :key="key">
    <MainLayout
        title="Task actions"
        :loading="state.isBooting"
        v-if="actionModalComponent === null && pluginModalComponent === null"
    >
        <template v-slot:actions>
            <span class="text-small me-2">{{ taskerStatus.text }}</span>
            <MdiIcon :icon="taskerStatus.icon" :class="[taskerStatus.text_class]" />
            <BaseButton
                btnClass="btn-primary ms-2"
                sm
                icon-left="plus"
                @click="newHomeAssistantTask"
                v-tooltip
                data-title="Create action"
            />
        </template>
        <template #default>
            <div class="alert alert-danger" v-if="taskerClientStatus === TaskerClientStatus.ERROR">
                {{ taskerClient.error }}
            </div>
            <div style="min-height: 200px">
                <div class="list-group">
                    <draggable
                        v-model="state.actionTypeRows"
                        group="people"
                        item-key="id"
                        handle=".action-row-reorder"
                        @end="reorderAction($event)"
                    >
                        <template #item="{ index, element }">
                            <ActionRow
                                v-bind="{ modelValue: element }"
                                :key="randomKey()"
                                @editAction="openIndex(index)"
                                @deleteAction="deleteAction(index)"
                                @refresh="refresh"
                            />
                        </template>
                    </draggable>
                </div>
            </div>
        </template>
    </MainLayout>
    <MainLayout
        v-if="pluginModalComponent !== null"
        :size="pluginModalComponent?.props.modelValue.modal_width"
    >
        <template #title>Edit Plugin: {{ pluginModalComponent?.props.modelValue.name }} </template>
        <template v-slot:actions>
            <span class="text-small me-2">{{ taskerStatus.text }}</span>
            <MdiIcon :icon="taskerStatus.icon" :class="[taskerStatus.text_class]" />
            <BaseButton
                :btn-class="'btn-primary m-2'"
                @click="pluginForm.submit()"
                sm
                icon-left="content-save"
                :disabled="taskerClient.isRunning"
                :loading="taskerClient.isRunning"
            />
            <BaseButton
                :disabled="taskerClient.isRunning"
                sm
                :btn-class="'btn-secondary'"
                icon-left="close"
                @click="router.push({ query: { edit: null } })"
            />
        </template>
        <template #default>
            <Vueform
                ref="pluginForm"
                validate-on="step"
                :display-errors="false"
                :endpoint="submitPlugin"
            >
                <component
                    v-if="pluginModalComponent"
                    :is="pluginModalComponent.component"
                    v-bind="pluginModalComponent.props"
                />
            </Vueform>
        </template>
    </MainLayout>

    <MainLayout
        v-if="actionModalComponent !== null"
        :size="actionModalComponent?.props.modelValue.modal_width"
        mainId="actionMainCard"
    >
        <template #title>
            Edit action:
            {{
                actionModalComponent?.props.modelValue.name === ''
                    ? actionModalComponent?.props.modelValue.tasker_name
                    : actionModalComponent?.props.modelValue.name
            }}
        </template>
        <template v-slot:actions>
            <span class="text-small me-2">{{ taskerStatus.text }}</span>
            <MdiIcon :icon="taskerStatus.icon" :class="[taskerStatus.text_class]" />
            <BaseButton
                btn-class="btn-primary m-2"
                sm
                @click="actionForm.submit()"
                icon-left="content-save"
                :disabled="taskerClient.isRunning"
                :loading="taskerClient.isRunning"
            />
            <BaseButton
                sm
                :disabled="taskerClient.isRunning"
                btn-class="btn-secondary"
                icon-left="close"
                @click="router.push({ query: { edit: null } })"
            />
            <BaseButton
                sm
                :disabled="taskerClient.isRunning"
                :btn-class="actionSettingForm ? 'btn-primary' : 'btn-outline-secondary'"
                class="ms-2"
                icon-left="cog"
                @click="actionSettingForm = !actionSettingForm"
            />
        </template>
        <template #default>
            <div class="high-index">
                <Vueform
                    ref="actionForm"
                    validate-on="step"
                    :display-errors="false"
                    :endpoint="submitBaseAction"
                    id="actionForm"
                >
                    <component
                        v-if="actionModalComponent"
                        :is="actionModalComponent.component"
                        v-bind="actionModalComponent.props"
                    />
                    <div
                        id="actionSettingpane"
                        class="settings-pane active"
                        v-if="actionSettingForm"
                    >
                        <div class="card h-100">
                            <div class="card-header">
                                <div class="row">
                                    <div
                                        class="col-6 d-flex align-items-center justify-content-start weird-height"
                                    >
                                        <div class="button-space">
                                            <BaseButton
                                                btnClass="btn-outline-secondary me-2"
                                                sm
                                                icon-left="arrow-left"
                                                @click="actionSettingForm = false"
                                            />
                                        </div>
                                        <h5 class="card-title">Settings</h5>
                                    </div>
                                    <div
                                        class="col-6 d-flex align-items-center justify-content-end weird-height"
                                    >
                                        <!-- actions -->
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">Komt later..</div>
                        </div>
                    </div>
                </Vueform>
            </div>
        </template>
    </MainLayout>
</template>
