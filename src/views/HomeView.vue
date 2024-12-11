<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { ActionTypeManager } from '@/tasker/helpers/ActionTypeManager'
import type { ActiontypeFormComponent } from '@/tasker/types/ActiontypeFormComponent'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import TaskerClient from '@/tasker/TaskerClient'
import MdiIcon from '@/components/MdiIcon.vue'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'
import BsModal from '@/components/BsModal.vue'
import type BaseActionType from '@/tasker/types/BaseActionType'
import { forEach } from 'lodash'
import ActionRow from '@/tasker/ActionRow.vue'
import type { PluginFormComponent } from '@/tasker/types/PluginFormComponent'
import HomeAssistantPlugin from '@/tasker/plugins/HomeAssistant/HomeAssistantPlugin'
import type BasePlugin from '@/tasker/types/BasePlugin'

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
        console.log('actions is null')
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
    console.log('deleteAction', index)

    taskerClientStatus.value = TaskerClientStatus.UPLOAD
    await taskerClient.value.deleteAction(index)
    await refresh()
}
</script>

<template :key="key">
    <MainLayout title="Task actions" :loading="isBooting">
        <template v-slot:headerButton></template>
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
            <BaseButton btnClass="btn-secondary ms-2" sm icon-left="cog" to="/settings" />
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

            <BsModal
                :show="actionModalComponent !== null"
                :width-class="actionModalComponent?.props.modelValue.modal_width"
                scrollable
                @close="refresh()"
            >
                <template #title>
                    Edit action:
                    {{
                        actionModalComponent?.props.modelValue.name === ''
                            ? actionModalComponent?.props.modelValue.tasker_name
                            : actionModalComponent?.props.modelValue.name
                    }}
                </template>

                <template #content>
                    <Vueform
                        ref="actionForm"
                        validate-on="step"
                        :display-errors="false"
                        :endpoint="onSubmit"
                    >
                        <component
                            v-if="actionModalComponent"
                            :is="actionModalComponent.component"
                            v-bind="actionModalComponent.props"
                        />
                    </Vueform>
                </template>

                <template #footer>
                    <BaseButton
                        :btn-class="'btn-primary'"
                        @click="actionForm.submit()"
                        icon-left="content-save"
                        :loading="taskerClient.isRunning"
                    >
                        Save
                    </BaseButton>
                    <BaseButton :btn-class="'btn-secondary'" @click="refresh()">
                        Cancel
                    </BaseButton>
                </template>
            </BsModal>
            <BsModal
                :show="pluginModalComponent !== null"
                :width-class="pluginModalComponent?.props.modelValue.modal_width"
                scrollable
                @close="refresh()"
            >
                <template #title>
                    Edit action:
                    {{ pluginModalComponent?.props.modelValue.name }}
                </template>

                <template #content>
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

                <template #footer>
                    <BaseButton
                        :btn-class="'btn-primary'"
                        @click="pluginForm.submit()"
                        icon-left="content-save"
                        :loading="taskerClient.isRunning"
                    >
                        Save
                    </BaseButton>
                    <BaseButton :btn-class="'btn-secondary'" @click="refresh()">
                        Cancel
                    </BaseButton>
                </template>
            </BsModal>
        </template>
    </MainLayout>
</template>
