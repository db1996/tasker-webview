<script setup lang="ts">
import { onMounted, ref, type PropType } from 'vue'
import HomeAssistantPlugin from '../HomeAssistantPlugin'
import BaseButton from '@/components/BaseButton.vue'
import PickEntity from './_partials/PickEntity.vue'
import type { HaEntity } from '../types/HaEntity'
import MdiIcon from '@/components/MdiIcon.vue'
import PickService from './_partials/PickService.vue'
import BsModal from '@/components/BsModal.vue'
import type { ActualService } from '../types/ActualService'
import type { HaServiceField } from '../types/HaServiceField'
import { HaServiceFieldType } from '../enums/HaServiceFieldType'

const emits = defineEmits(['update-form-value'])

const props = defineProps({
    modelValue: Object as PropType<HomeAssistantPlugin>,
    actionForm: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: Object as PropType<any>, // Or use the specific Vueform type if available
        required: false,
    },
})

const keys = ref<{ pickSerivce: number; pickEntity: number }>({
    pickSerivce: 1,
    pickEntity: 999999,
})

const client = HomeAssistantPlugin.client
const currentView = ref('main')
const currentDomain = ref(props.modelValue?.serviceData.domain ?? '')
const pickService = ref(null)
const pickEntity = ref(null)
const currentService = ref<ActualService | null>(null)
const fieldsRef = ref<HaServiceField[]>([])

onMounted(async () => {
    await client?.ping()

    if (props.modelValue?.serviceData.domain && props.modelValue?.serviceData.service) {
        await servicePicked({
            domain: props.modelValue?.serviceData.domain,
            service: props.modelValue?.serviceData.service,
        })
    }
})

function entityPicked(entity: HaEntity) {
    emits('update-form-value', {
        key: 'HomeAssistantForm.MainForm.entityContainer.entity',
        value: entity.entity_id ?? '',
    })
    keys.value.pickEntity++
    keys.value.pickSerivce++

    currentView.value = 'main'
}

async function servicePicked(pickedData: { domain: string; service: string }) {
    const resp = await client?.GetService(pickedData.domain, pickedData.service)

    if (!resp) {
        currentService.value = null
        fieldsRef.value = []
        return
    }
    emits('update-form-value', {
        key: 'HomeAssistantForm.MainForm.service',
        value: pickedData.service,
    })
    emits('update-form-value', {
        key: 'HomeAssistantForm.MainForm.domain',
        value: pickedData.domain,
    })
    keys.value.pickSerivce++
    if (pickedData.domain !== currentDomain.value) {
        emits('update-form-value', {
            key: 'HomeAssistantForm.MainForm.entityContainer.entity',
            value: '',
        })
        currentDomain.value = pickedData.domain
        keys.value.pickEntity++
    }

    currentService.value = resp
    fieldsRef.value = resp.fields

    currentView.value = 'main'
}
</script>
<template>
    <GroupElement name="HomeAssistantForm">
        <GroupElement name="MainForm">
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
            <ObjectElement name="dataContainer">
                <ObjectElement v-for="(field, index) in fieldsRef" :key="field.id" :name="field.id">
                    <CheckboxElement
                        :name="'toggle'"
                        :field-name="'toggle'"
                        :columns="{
                            default: 1,
                        }"
                        :align="'right'"
                        :info="index === 0 ? 'Toggle this field' : ''"
                        :default="
                            modelValue?.serviceData.data &&
                            modelValue?.serviceData.data[field.id] !== undefined
                                ? true
                                : field.required
                        "
                        label="&nbsp;"
                    />
                    <TextElement
                        v-if="field.type === HaServiceFieldType.TEXT"
                        :name="'value'"
                        :label="field.name ?? field.id"
                        :info="field.description"
                        info-position="right"
                        :field-name="field.id"
                        :default="
                            modelValue?.serviceData.data &&
                            modelValue?.serviceData.data[field.id] !== undefined
                                ? modelValue?.serviceData.data[field.id]
                                : ''
                        "
                        :placeholder="field.example"
                        :columns="{
                            default: 11,
                        }"
                    />
                    <TextElement
                        v-if="field.type === HaServiceFieldType.NUMBER"
                        :name="'value'"
                        :label="field.name ?? field.id"
                        :info="field.description + ' min: ' + field.min + ' max: ' + field.max"
                        info-position="right"
                        type="number"
                        :force-numbers="true"
                        :placeholder="field.example"
                        :addons="{
                            after: field.unit_of_measurement,
                        }"
                        :default="
                            modelValue?.serviceData.data &&
                            modelValue?.serviceData.data[field.id] !== undefined
                                ? modelValue?.serviceData.data[field.id]
                                : ''
                        "
                        :field-name="field.id"
                        :columns="{
                            default: 11,
                        }"
                    />
                    <SelectElement
                        v-if="field.type === HaServiceFieldType.SELECT"
                        :name="'value'"
                        :label="field.name ?? field.id"
                        :items="field.options ?? []"
                        :columns="{
                            default: 11,
                        }"
                    />
                    <ToggleElement
                        v-if="field.type === HaServiceFieldType.BOOLEAN"
                        :name="'value'"
                        :label="field.name ?? field.id"
                        :columns="{
                            default: 11,
                        }"
                    />
                    <DateElement
                        v-if="
                            field.type === HaServiceFieldType.DATE ||
                            field.type === HaServiceFieldType.TIME ||
                            field.type === HaServiceFieldType.DATETIME
                        "
                        :date="
                            field.type === HaServiceFieldType.DATE ||
                            field.type === HaServiceFieldType.DATETIME
                        "
                        :time="
                            field.type === HaServiceFieldType.TIME ||
                            field.type === HaServiceFieldType.DATETIME
                        "
                        :default="
                            modelValue?.serviceData.data &&
                            modelValue?.serviceData.data[field.id] !== undefined
                                ? modelValue?.serviceData.data[field.id]
                                : ''
                        "
                        :name="'value'"
                        :label="field.name ?? field.id"
                        :field-name="field.id"
                        :columns="{
                            default: 1,
                        }"
                    />
                </ObjectElement>
            </ObjectElement>
        </GroupElement>

        <BsModal
            :show="currentView === 'service'"
            :width-class="'lg'"
            @close="currentView = 'main'"
        >
            <template #title>
                <h5>Pick a service</h5>
            </template>
            <template #content>
                <PickService
                    ref="pickService"
                    :key="keys.pickSerivce"
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
    </GroupElement>
</template>
