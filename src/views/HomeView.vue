<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import MdiIcon from '@/components/MdiIcon.vue'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'
import ActionRow from '@/tasker/Views/ActionRow.vue'
import HomeAssistantPlugin from '@/tasker/plugins/HomeAssistant/HomeAssistantPlugin'
import { useTaskerClient } from '@/stores/useTaskerClient'
import HomeViewState from '@/helpers/homeView/HomeViewState'
import router from '@/router'
import { useRoute } from 'vue-router'
import { EditStatusEnum } from '@/helpers/homeView/EditStatusEnum'
import EditSettings from '@/tasker/Views/EditSettings.vue'

const taskerClient = useTaskerClient().taskerClient
const route = useRoute()
const state = ref<HomeViewState>(new HomeViewState())
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editForm$ = ref<any>()

watch(
    () => route.query.edit,
    async () => await checkEditParam(),
)

watch(
    () => route.query.plugin,
    async () => await checkEditParam(),
)

watch(
    () => state.value.isBooting,
    async (value) => {
        if (!value) {
            console.log('Booting done')

            await checkEditParam()
        }
    },
)

async function checkEditParam() {
    state.value.urlParams = urlParams.value
    if (urlParams.value.edit !== null) {
        const actionIndex = urlParams.value.edit
        const pluginIndex = urlParams.value.plugin
        state.value.setEditAction(actionIndex, pluginIndex)
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
    console.log(state.value.editStatus)

    if (
        state.value.editStatus == EditStatusEnum.EditPlugin &&
        urlParams.value.edit !== null &&
        urlParams.value.plugin !== null
    ) {
        const actionType = state.value.actionTypeRows[urlParams.value.edit]
        if (actionType) {
            const plugin = actionType.supported_plugins[urlParams.value.plugin]
            const resp = plugin.submitForm(data)
            state.value.currentAction?.submitDefaultSettingsForm(data)
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
        state.value.newBasePlugin?.actionType.submitDefaultSettingsForm(data)
        state.value.newBasePlugin.setArgs()
        await taskerClient.insertActionLast(state.value.newBasePlugin.actionType)
    } else if (
        state.value.editStatus == EditStatusEnum.EditAction &&
        urlParams.value.edit !== null
    ) {
        const actionType = state.value.currentAction
        if (actionType) {
            const resp = actionType.submitForm(data)
            const settingsRep = actionType.submitDefaultSettingsForm(data)
            if (resp && settingsRep) {
                await taskerClient.replaceAction(actionType)
            }
        }
    } else if (state.value.editStatus == EditStatusEnum.AddAction) {
        const actionType = state.value.currentAction
        console.log(actionType)

        if (actionType) {
            const resp = actionType.submitForm(data)
            const settingsRep = actionType.submitDefaultSettingsForm(data)
            if (resp && settingsRep) {
                await taskerClient.insertActionLast(actionType)
            }
        }
    }
    state.value.refresh()
}

async function newHomeAssistantTask() {
    state.value.newBasePlugin = HomeAssistantPlugin.createNewAction()
    state.value.editStatus = EditStatusEnum.AddPlugin

    const typeFormComponentEntry = await state.value.newBasePlugin.getFormComponent()
    state.value.pluginFormComponent = typeFormComponentEntry

    state.value.content_height = typeFormComponentEntry.props.modelValue.actionType.content_height
}

async function newAction(code: number) {
    state.value.createNewAction(code)
}

function setFormValue(val: { key: string; value: string }) {
    if (editForm$.value === null) {
        return
    }

    const field = editForm$.value.el$(val.key)
    if (field) {
        field.update(val.value)
    }
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
            <!-- <BaseButton
                btnClass="btn-secondary ms-2"
                sm
                icon-left="plus"
                @click="newAction(547)"
                v-tooltip
                data-title="Create action"
                :checkrunning="true"
            /> -->
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
                @click="editForm$?.submit()"
                icon-left="content-save"
                :checkrunning="true"
            />
            <BaseButton
                sm
                :disabled="taskerClient.isRunning"
                btn-class="btn-secondary"
                icon-left="close"
                @click="state.refresh()"
            />
            <BaseButton
                sm
                :checkrunning="true"
                :btn-class="state.showSettings ? 'btn-primary' : 'btn-outline-secondary'"
                class="ms-2"
                icon-left="cog"
                @click="state.showSettings = !state.showSettings"
            />
        </template>
        <template #default>
            <div :style="{ height: state.content_height, overflowY: 'auto', overflowX: 'hidden' }">
                <Vueform
                    ref="editForm$"
                    validate-on="step"
                    :display-errors="false"
                    :endpoint="submitForm"
                    id="editForm$"
                >
                    <component
                        v-if="
                            state.pluginFormComponent &&
                            (state.editStatus === EditStatusEnum.EditPlugin ||
                                state.editStatus === EditStatusEnum.AddPlugin)
                        "
                        :class="{ 'd-none': state.showSettings }"
                        :is="state.pluginFormComponent.component"
                        @update-form-value="setFormValue"
                        v-bind="{ ...state.pluginFormComponent.props }"
                    />
                    <component
                        v-if="
                            state.actionTypeFormComponent &&
                            (state.editStatus === EditStatusEnum.EditAction ||
                                state.editStatus === EditStatusEnum.AddAction)
                        "
                        :class="{ 'd-none': state.showSettings }"
                        :is="state.actionTypeFormComponent.component"
                        v-bind="state.actionTypeFormComponent.props"
                    />
                    <EditSettings
                        v-if="state.currentAction"
                        :class="{ 'd-none': !state.showSettings }"
                        v-bind="{
                            modelValue: state.currentAction,
                            editSettingsForm: state.settingsFormComponent,
                        }"
                    />
                </Vueform>
            </div>
        </template>
    </MainLayout>
</template>
