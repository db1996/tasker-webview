<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, onMounted, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import MdiIcon from '@/components/MdiIcon.vue'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'
import ActionRow from '@/tasker/ActionRow.vue'
import type { PluginFormComponent } from '@/tasker/plugins/PluginFormComponent'
import HomeAssistantPlugin from '@/tasker/plugins/HomeAssistant/HomeAssistantPlugin'
import { useTaskerClient } from '@/stores/useTaskerClient'
import HomeViewState from '@/helpers/homeView/HomeViewState'
import router from '@/router'
import { useRoute } from 'vue-router'
import { EditStatusEnum } from '@/helpers/homeView/EditStatusEnum'

const taskerClient = useTaskerClient().taskerClient
const route = useRoute()
const state = ref<HomeViewState>(new HomeViewState())
const editForm = ref()
const actionSettingForm = ref(false)
const isBooting = ref(true)

watch(
    () => route.query.edit, // Use a function to track `route.query.edit`
    async () => checkEditParam(),
)

async function checkEditParam(refreshNoEdit: boolean = true) {
    if (urlParams.value.edit !== null) {
        const actionIndex = urlParams.value.edit
        const pluginIndex = urlParams.value.plugin
        const action = state.value.actionTypeRows[actionIndex]
        if (pluginIndex !== null) {
            const typeFormComponentEntry: PluginFormComponent =
                await state.value.actionTypeRows[actionIndex].supported_plugins[
                    pluginIndex
                ].getFormComponent()

            state.value.pluginFormComponent = typeFormComponentEntry
            state.value.actionTypeFormComponent = null
            state.value.editStatus = EditStatusEnum.EditPlugin
        } else {
            if (action) {
                state.value.actionTypeFormComponent = await action.getFormComponent()
                state.value.pluginFormComponent = null
                state.value.editStatus = EditStatusEnum.EditAction
            }
        }
    } else {
        if (refreshNoEdit) {
            await state.value.refresh()
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
    await state.value.refresh()
    await checkEditParam(false)
    isBooting.value = false
})

function randomKey() {
    return Math.random().toString(36).substring(7)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reorderAction(event: any) {
    if (event.newIndex !== event.oldIndex) {
        await taskerClient.moveAction(event.oldIndex, event.newIndex)
        await state.value.refresh()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function submitForm(FormData: any, form$: any) {
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
                await state.value.refresh()
            }
        }
    } else if (
        state.value.editStatus == EditStatusEnum.AddPlugin &&
        state.value.newBasePlugin !== null
    ) {
        state.value.newBasePlugin.submitForm(data)
        state.value.newBasePlugin.setArgs()
        await taskerClient.insertActionLast(state.value.newBasePlugin.actionType)
    } else if (
        state.value.editStatus == EditStatusEnum.EditAction &&
        urlParams.value.edit !== null
    ) {
        const actionType = state.value.actionTypeRows[urlParams.value.edit]
        if (actionType) {
            const resp = actionType.submitForm(data)
            if (resp) {
                await taskerClient.replaceAction(actionType)
            }
        }
    }
    router.push({ query: {} })
}

async function newHomeAssistantTask() {
    state.value.newBasePlugin = HomeAssistantPlugin.createNewAction()
    state.value.editStatus = EditStatusEnum.AddPlugin

    const typeFormComponentEntry: PluginFormComponent =
        await state.value.newBasePlugin.getFormComponent()
    state.value.pluginFormComponent = typeFormComponentEntry
}
</script>

<template :key="key">
    <MainLayout title="Task actions" v-if="state.editStatus === EditStatusEnum.None">
        <template v-slot:actions>
            <span class="text-small me-2">{{ state.taskerStatus.text }}</span>
            <MdiIcon :icon="state.taskerStatus.icon" :class="[state.taskerStatus.text_class]" />
            <BaseButton
                btnClass="btn-primary ms-2"
                sm
                icon-left="plus"
                @click="newHomeAssistantTask"
                v-tooltip
                data-title="Create action"
                :checkrunning="true"
            />
        </template>
        <template #default>
            <div
                class="alert alert-danger"
                v-if="taskerClient.taskerClientStatus === TaskerClientStatus.ERROR"
            >
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
                                @editAction="router.push({ query: { edit: index } })"
                                @editPlugin="
                                    router.push({ query: { edit: index, plugin: $event } })
                                "
                                @refresh="state.refresh"
                            />
                        </template>
                    </draggable>
                </div>
            </div>
        </template>
    </MainLayout>
    <MainLayout
        v-if="state.editStatus !== EditStatusEnum.None"
        :size="state.actionTypeFormComponent?.props.modelValue.modal_width"
    >
        <template #title>
            Edit action:
            {{
                state.actionTypeFormComponent?.props.modelValue.name === ''
                    ? state.actionTypeFormComponent?.props.modelValue.tasker_name
                    : state.actionTypeFormComponent?.props.modelValue.name
            }}
        </template>
        <template v-slot:actions>
            <span class="text-small me-2">{{ state.taskerStatus.text }}</span>
            <MdiIcon :icon="state.taskerStatus.icon" :class="[state.taskerStatus.text_class]" />
            <BaseButton
                btn-class="btn-primary m-2"
                sm
                @click="editForm.submit()"
                icon-left="content-save"
                :checkrunning="true"
            />
            <BaseButton
                sm
                :disabled="taskerClient.isRunning"
                btn-class="btn-secondary"
                icon-left="close"
                @click="router.push({ query: {} })"
            />
            <BaseButton
                sm
                :checkrunning="true"
                :btn-class="actionSettingForm ? 'btn-primary' : 'btn-outline-secondary'"
                class="ms-2"
                icon-left="cog"
                @click="actionSettingForm = !actionSettingForm"
            />
        </template>
        <template #default>
            <Vueform
                ref="editForm"
                validate-on="step"
                :display-errors="false"
                :endpoint="submitForm"
                id="editForm"
            >
                <component
                    v-if="
                        state.pluginFormComponent !== null &&
                        (state.editStatus === EditStatusEnum.EditPlugin ||
                            state.editStatus === EditStatusEnum.AddPlugin)
                    "
                    :is="state.pluginFormComponent.component"
                    v-bind="state.pluginFormComponent.props"
                />
                <component
                    v-if="
                        state.actionTypeFormComponent &&
                        (state.editStatus === EditStatusEnum.EditAction ||
                            state.editStatus === EditStatusEnum.AddAction)
                    "
                    :is="state.actionTypeFormComponent.component"
                    v-bind="state.actionTypeFormComponent.props"
                />
                <StaticElement name="settingsPane">
                    <div
                        id="actionSettingpane"
                        class="settings-pane"
                        :class="{ active: actionSettingForm }"
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
                                                icon-left="close"
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
                </StaticElement>
            </Vueform>
        </template>
    </MainLayout>
</template>
