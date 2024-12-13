<script setup lang="ts">
import { onMounted, ref, type PropType } from 'vue'
import type HomeAssistantPlugin from '../HomeAssistantPlugin'
import BaseButton from '@/components/BaseButton.vue'
import PickEntity from './_partials/PickEntity.vue'
import type { HaEntity } from '../types/HaEntity'
import MdiIcon from '@/components/MdiIcon.vue'
import PickService from './_partials/PickService.vue'
import HttpSettings from '@/tasker/actionTypes/HttpRequest/Components/HttpSettings.vue'
import BsModal from '@/components/BsModal.vue'

const emits = defineEmits(['update-form-value'])

const props = defineProps({
    modelValue: Object as PropType<HomeAssistantPlugin>,
    actionForm: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: Object as PropType<any>, // Or use the specific Vueform type if available
        required: false,
    },
})

const currentTab = ref('main')
const keys = ref<{ pickSerivce: number; pickEntity: number }>({
    pickSerivce: 1,
    pickEntity: 999999,
})

function radioTabChanged(value: string) {
    currentTab.value = value
}

const client = props.modelValue?.client
const currentData = ref('')
const dataLoaded = ref(false)
const currentView = ref('main')
const currentDomain = ref(props.modelValue?.serviceData.domain ?? '')
const pickService = ref(null)
const pickEntity = ref(null)

onMounted(async () => {
    await client?.ping()
    currentData.value = ''
    if (props.modelValue?.serviceData.data) {
        currentData.value = JSON.stringify(props.modelValue?.serviceData.data, null, 4)
    }
    dataLoaded.value = true
})

function entityPicked(entity: HaEntity) {
    emits('update-form-value', {
        key: 'MainForm.entityContainer.entity',
        value: entity.entity_id ?? '',
    })
    keys.value.pickEntity++
    keys.value.pickSerivce++

    currentView.value = 'main'
}

function servicePicked(service: { domain: string; service: string }) {
    emits('update-form-value', {
        key: 'MainForm.domain',
        value: service.domain,
    })
    emits('update-form-value', {
        key: 'MainForm.service',
        value: service.service,
    })
    currentDomain.value = service.domain

    keys.value.pickEntity++
    keys.value.pickSerivce++
    currentView.value = 'main'
}
</script>
<template>
    <RadiogroupElement
        name="radioTabs"
        view="tabs"
        @change="radioTabChanged"
        :items="[
            {
                value: 'main',
                label: 'Main',
            },
            {
                value: 'settings',
                label: 'Settings',
            },
        ]"
        :default="currentTab"
    />
    <GroupElement name="MainForm" v-show="currentTab === 'main'">
        <StaticElement name="html" v-if="client?.error !== ''">
            <template #default>
                <div class="alert alert-danger">
                    <div class="row">
                        <div class="col">
                            <h3>Could not connect to homeassistant</h3>
                            {{ client?.error }}
                        </div>
                        <div class="col-1 d-flex align-items-center">
                            <BaseButton
                                :loading="client?.isRunning"
                                @click="client?.ping()"
                                icon-left="reload"
                            />
                        </div>
                    </div>
                </div>
            </template>
        </StaticElement>
        <StaticElement name="">
            <div class="row">
                <div class="col">
                    <h5>Fill in details</h5>
                    <BaseButton @click="currentView = 'service'" :btn-class="'btn-secondary'">
                        Pick service
                    </BaseButton>
                </div>
            </div>
        </StaticElement>
        <TextElement
            name="domain"
            label="Domain"
            field-name="domain"
            :default="props.modelValue?.serviceData.domain ?? ''"
        />
        <TextElement
            name="service"
            label="Service"
            field-name="service"
            :default="props.modelValue?.serviceData.service ?? ''"
        />
        <GroupElement name="entityContainer">
            <TextElement
                ref="entityInput"
                name="entity"
                label="Entity"
                field-name="entity"
                :default="props.modelValue?.serviceData.entity_id ?? ''"
                :columns="{
                    default: 11,
                }"
            />

            <ButtonElement
                label="Pick"
                name="primaryButton"
                @click="currentView = 'entity'"
                :columns="{
                    default: 1,
                }"
            >
                <MdiIcon icon="pencil" />
            </ButtonElement>
        </GroupElement>
        <TextareaElement
            v-if="dataLoaded"
            name="data"
            label="Data"
            field-name="data"
            :default="currentData"
        />
    </GroupElement>
    <HttpSettings
        v-show="currentTab === 'settings'"
        v-if="modelValue !== null && modelValue?.realActionType !== null"
        :HttpActionType="modelValue?.realActionType"
    />

    <BsModal :show="currentView === 'service'" :width-class="'lg'" @close="currentView = 'main'">
        <template #title>
            <h5>Pick a service</h5>
        </template>
        <template #content>
            <PickService
                ref="pickService"
                :key="keys.pickSerivce"
                :modelValue="modelValue"
                @picked="servicePicked"
                @stop="currentView = 'main'"
            />
        </template>
    </BsModal>
    <BsModal :show="currentView === 'entity'" :width-class="'lg'" @close="currentView = 'main'">
        <template #title>
            <h5>Pick an entity for the service: {{ modelValue?.serviceData.domain ?? '' }}</h5>
        </template>
        <template #content>
            <PickEntity
                ref="pickEntity"
                :key="keys.pickEntity"
                :modelValue="modelValue"
                :domain="currentDomain"
                @picked="entityPicked"
                @stop="currentView = 'main'"
            />
        </template>
    </BsModal>
</template>
