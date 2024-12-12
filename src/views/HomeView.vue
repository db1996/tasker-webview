<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { ActionTypeManager } from '@/tasker/helpers/ActionTypeManager'
import type { ActiontypeFormComponent } from '@/tasker/actionTypes/ActiontypeFormComponent'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import TaskerClient from '@/tasker/TaskerClient'
import MdiIcon from '@/components/MdiIcon.vue'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'
import type BaseActionType from '@/tasker/actionTypes/BaseActionType'
import { forEach } from 'lodash'
import ActionRow from '@/tasker/ActionRow.vue'
import type { PluginFormComponent } from '@/tasker/plugins/PluginFormComponent'
import HomeAssistantPlugin from '@/tasker/plugins/HomeAssistant/HomeAssistantPlugin'
import type BasePlugin from '@/tasker/plugins/BasePlugin'

const taskerClient = ref<TaskerClient>(new TaskerClient())
const actionTypes = ref<BaseActionType[]>([])
const taskerClientStatus = ref<TaskerClientStatus>(TaskerClientStatus.NONE)
const modalPlugin = ref<{
    actionTypeIndex: number | null
    pluginIndex: number | null
} | null>({
    actionTypeIndex: null,
    pluginIndex: null,
})
const actionForm = ref()
const pluginForm = ref()
const actionModalComponent = ref<ActiontypeFormComponent | null>(null)
const pluginModalComponent = ref<PluginFormComponent | null>(null)
const isBooting = ref(true)

onMounted(async () => {
    await refresh()
    isBooting.value = false
})

onUnmounted(() => {
    actionTypes.value = []
})

const isRefreshing = ref(false)
async function refresh() {
    // reload entire page
    if (!isRefreshing.value) {
        actionModalComponent.value = null
        isNewPluginAction.value = false
        isRefreshing.value = true
        modalPlugin.value = null
        await initActions()
    }

    isRefreshing.value = false
}

async function openActiontypeForm(actionType: BaseActionType) {
    actionModalComponent.value = await actionType.getFormComponent()
    modalPlugin.value = null
}

watch([modalPlugin, actionTypes], async () => {
    if (
        modalPlugin.value !== null &&
        modalPlugin.value.actionTypeIndex !== null &&
        modalPlugin.value.pluginIndex !== null &&
        actionTypes.value[modalPlugin.value.actionTypeIndex] !== undefined &&
        actionTypes.value[modalPlugin.value.actionTypeIndex].supported_plugins[
            modalPlugin.value.pluginIndex
        ] !== undefined
    ) {
        actionModalComponent.value = null
        const typeFormComponentEntry: PluginFormComponent =
            await actionTypes.value[modalPlugin.value.actionTypeIndex].supported_plugins[
                modalPlugin.value.pluginIndex
            ].getFormComponent()

        pluginModalComponent.value = typeFormComponentEntry
    } else {
        pluginModalComponent.value = null
    }
})

async function initActions() {
    taskerClientStatus.value = TaskerClientStatus.RETRIEVE

    const actions = await taskerClient.value.getActions()
    if (actions != null) {
        const manager = new ActionTypeManager()
        await manager.loadPlugins()
        await manager.loadForms()
        actionTypes.value = []
        forEach(actions, async (action, index) => {
            const baseActionType = manager.getFormForAction(action)
            if (baseActionType != null) {
                baseActionType.index = index
                actionTypes.value.push(baseActionType)
            }
        })
        taskerClientStatus.value = TaskerClientStatus.NONE
    } else {
        actionTypes.value = []
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
        await taskerClient.value.moveAction(event.oldIndex, event.newIndex)
        await refresh()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function onSubmit(FormData: any, form$: any) {
    const data = form$.data
    const actionType = actionModalComponent.value?.props.modelValue as BaseActionType
    if (actionType) {
        const resp = actionType.submitForm(data)
        if (resp) {
            await taskerClient.value.replaceAction(actionType)
            await refresh()
        }
    }
}

const isNewPluginAction = ref(false)
const newPluginType = ref<BasePlugin | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function submitPlugin(FormData: any, form$: any) {
    const data = form$.data
    if (!isNewPluginAction.value) {
        const actionType = actionTypes.value[modalPlugin.value?.actionTypeIndex as number]
        if (actionType) {
            const plugin = actionType.supported_plugins[modalPlugin.value?.pluginIndex as number]
            const resp = plugin.submitForm(data)
            if (resp) {
                plugin.setArgs()
                await taskerClient.value.replaceAction(plugin.actionType)
                await refresh()
            }
        }
    } else if (newPluginType.value !== null) {
        newPluginType.value.submitForm(data)
        newPluginType.value.setArgs()
        await taskerClient.value.insertActionLast(newPluginType.value.actionType)
        await refresh()
    }
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
            ret.tooltip = taskerClient.value.error
            break

        default:
            break
    }
    return ret
})

async function newHomeAssistantTask() {
    newPluginType.value = HomeAssistantPlugin.createNewAction()
    isNewPluginAction.value = true

    const typeFormComponentEntry: PluginFormComponent = await newPluginType.value.getFormComponent()

    pluginModalComponent.value = typeFormComponentEntry
}

async function deleteAction(index: number) {
    taskerClientStatus.value = TaskerClientStatus.UPLOAD
    await taskerClient.value.deleteAction(index)
    await refresh()
}

const cardExists = ref(false)
onMounted(() => {
    const checkCardExists = () => {
        cardExists.value = !!document.querySelector('#actionMainCard')
    }

    // Initial check
    checkCardExists()

    // Create a MutationObserver to monitor DOM changes
    const observer = new MutationObserver(() => {
        checkCardExists() // Recheck whenever DOM changes
    })

    // Observe the body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    })

    // Cleanup the observer on unmount
    onUnmounted(() => {
        observer.disconnect()
    })
})

const actionSettingForm = ref(false)
</script>

<template :key="key">
    <MainLayout
        title="Task actions"
        :loading="isBooting"
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
                        v-model="actionTypes"
                        group="people"
                        item-key="id"
                        handle=".action-row-reorder"
                        @end="reorderAction($event)"
                    >
                        <template #item="{ index, element }">
                            <ActionRow
                                v-bind="{ modelValue: element }"
                                :key="randomKey()"
                                @editAction="openActiontypeForm(element)"
                                @deleteAction="deleteAction(index)"
                                @editPlugin="
                                    modalPlugin = {
                                        actionTypeIndex: index,
                                        pluginIndex: $event.index,
                                    }
                                "
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
                @click="refresh()"
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
                @click="refresh()"
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
                    :endpoint="onSubmit"
                    id="actionForm"
                >
                    <component
                        v-if="actionModalComponent"
                        :is="actionModalComponent.component"
                        v-bind="actionModalComponent.props"
                    />

                    <Teleport
                        :disabled="!cardExists"
                        :key="cardExists.toString()"
                        to="#actionMainCard"
                    >
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
                    </Teleport>
                </Vueform>
            </div>
        </template>
    </MainLayout>
</template>
