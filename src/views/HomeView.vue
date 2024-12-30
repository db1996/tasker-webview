<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import MdiIcon from '@/components/MdiIcon.vue'
import { TaskerClientStatus } from '@/tasker/enums/TaskerClientStatus'
import ActionRow from '@/tasker/Views/ActionRow.vue'
import { useTaskerClient } from '@/stores/useTaskerClient'
import HomeViewState from '@/helpers/homeView/HomeViewState'
import router from '@/router'
import { useRoute } from 'vue-router'
import { EditStatusEnum } from '@/helpers/homeView/EditStatusEnum'
import EditSettings from '@/tasker/Views/EditSettings.vue'
import BsModal from '@/components/BsModal.vue'
import PickNewTask from './partials/pickNewTask.vue'
import type actionSpecCard from '@/helpers/homeView/actionSpecCard'
import PickVariable from './partials/pickVariable.vue'

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
    () => route.query.add,
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

    const pluginIndex = urlParams.value.plugin
    if (urlParams.value.edit !== null) {
        const actionIndex = urlParams.value.edit
        state.value.setEditAction(actionIndex, pluginIndex)
    } else if (urlParams.value.add !== null) {
        const actionCode = urlParams.value.add
        state.value.createNewAction(actionCode, pluginIndex)
    } else {
        await state.value.refresh()
    }
}

const urlParams = computed(() => {
    const params: { edit: number | null; plugin: string | null; add: number | null } = {
        edit: null,
        plugin: null,
        add: null,
    }

    if (route.query.plugin !== undefined && route.query.plugin !== null) {
        params.plugin = route.query.plugin as string
    }
    if (route.query.edit !== undefined && route.query.edit !== null) {
        params.edit = parseFloat(route.query.edit as string)
    }
    if (route.query.add !== undefined && route.query.add !== null) {
        params.add = parseFloat(route.query.add as string)
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
    if (
        state.value.editStatus == EditStatusEnum.EditPlugin &&
        urlParams.value.edit !== null &&
        urlParams.value.plugin !== null
    ) {
        const actionType = state.value.actionTypeRows[urlParams.value.edit]
        if (actionType) {
            const plugin = actionType.getPlugin(urlParams.value.plugin)
            if (!plugin) {
                return
            }
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

function setFormValue(val: { key: string; value: string }) {
    if (editForm$.value === null) {
        return
    }

    const field = editForm$.value.el$(val.key)
    if (field) {
        field.update(val.value)
    }
}

function newTaskPicked(card: actionSpecCard) {
    router.push({ query: { add: card.code, plugin: card.plugin } })
    state.value.showNewTaskModal = false
}
</script>

<template :key="key">
    <PickVariable :show="state.pickVariable" @close="state.pickVariable = false" />
    <BsModal
        :show="state.showNewTaskModal"
        :width-class="'lg'"
        @close="state.showNewTaskModal = false"
    >
        <template #title>
            <h5>Pick an action</h5>
        </template>
        <template #content>
            <PickNewTask @picked="newTaskPicked" />
        </template>
    </BsModal>
    <MainLayout title="Task actions" v-if="state.editStatus === EditStatusEnum.None">
        <template #headerButton>
            <BaseButton
                @click="state.pickVariable = true"
                btnClass="btn-primary me-2"
                sm
                icon-left="tag"
            />
        </template>
        <template v-slot:actions>
            <span class="text-small me-2">{{ state.taskerStatus.text }}</span>
            <MdiIcon :icon="state.taskerStatus.icon" :class="[state.taskerStatus.text_class]" />
            <BaseButton
                btnClass="btn-primary ms-2"
                sm
                icon-left="plus"
                @click="state.showNewTaskModal = true"
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
                                @editAction="router.push({ query: { edit: index, plugin: null } })"
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
    <MainLayout v-if="state.editStatus !== EditStatusEnum.None">
        <template #headerButton>
            <BaseButton
                @click="state.pickVariable = true"
                btnClass="btn-primary me-2"
                sm
                icon-left="tag"
            />
        </template>
        <template #title>
            {{
                state.editStatus === EditStatusEnum.EditAction ||
                state.editStatus === EditStatusEnum.EditPlugin
                    ? 'Edit'
                    : 'Add'
            }}
            action:
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
