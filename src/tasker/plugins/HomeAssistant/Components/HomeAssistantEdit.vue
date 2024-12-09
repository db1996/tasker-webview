<script setup lang="ts">
import { onMounted, ref, type PropType } from 'vue'
import type HomeAssistantPlugin from '../HomeAssistantPlugin'
import BaseButton from '@/components/BaseButton.vue'
import PickEntity from './_partials/PickEntity.vue'
import type { HaEntity } from '../types/HaEntity'
import MdiIcon from '@/components/MdiIcon.vue'
import PickService from './_partials/PickService.vue'

const props = defineProps({
    modelValue: Object as PropType<HomeAssistantPlugin>,
})

const client = props.modelValue?.client
const entityId = ref(props.modelValue?.serviceData.entity_id ?? '')
const currentService = ref(props.modelValue?.serviceData.service ?? '')
const currentDomain = ref(props.modelValue?.serviceData.domain ?? '')
const currentData = ref('')
const dataLoaded = ref(false)
const currentView = ref('main')

onMounted(async () => {
    await client?.ping()
    currentData.value = ''
    if (props.modelValue?.serviceData.data) {
        currentData.value = JSON.stringify(props.modelValue?.serviceData.data, null, 4)
    }
    dataLoaded.value = true
})

function entityPicked(entity: HaEntity) {
    entityId.value = entity.entity_id ?? ''
    currentView.value = 'main'
}

function servicePicked(service: { domain: string; service: string }) {
    currentService.value = service.service
    currentDomain.value = service.domain
    dataLoaded.value = false
    currentData.value = ''
    dataLoaded.value = true
    currentView.value = 'main'
}
</script>
<template>
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
                <div v-if="currentView === 'main'">
                    <h5>Fill in details</h5>
                    <BaseButton
                        v-if="currentView === 'main'"
                        @click="currentView = 'service'"
                        :btn-class="'btn-secondary'"
                    >
                        Pick service
                    </BaseButton>
                </div>
                <h5 v-if="currentView === 'entity'">
                    Pick an entity for the service: {{ modelValue?.serviceData.domain ?? '' }}
                </h5>

                <h5 v-if="currentView === 'service'">Pick an action to run</h5>
            </div>
            <div class="col-2">
                <BaseButton
                    v-if="currentView !== 'main'"
                    @click="currentView = 'main'"
                    :btn-class="'btn-secondary'"
                    icon-left="arrow-left"
                />
            </div>
        </div>
    </StaticElement>
    <TextElement
        v-if="currentView === 'main'"
        name="domain"
        label="Domain"
        field-name="domain"
        :v-model="currentDomain"
        :default="currentDomain"
    />
    <TextElement
        v-if="currentView === 'main'"
        name="service"
        label="Service"
        field-name="service"
        :v-model="currentService"
        :default="currentService"
    />
    <GroupElement name="container2" v-if="currentView === 'main'">
        <TextElement
            ref="entityInput"
            name="entity"
            label="Entity"
            field-name="entity"
            :v-model="entityId"
            :default="entityId"
            :columns="{
                default: 10,
            }"
        />

        <ButtonElement
            label="Pick"
            name="primaryButton"
            @click="currentView = 'entity'"
            :columns="{
                default: 2,
            }"
        >
            <MdiIcon icon="pencil" />
        </ButtonElement>
    </GroupElement>
    <TextareaElement
        v-if="currentView === 'main' && dataLoaded"
        name="data"
        label="Data"
        field-name="data"
        :v-model="currentData"
        :default="currentData"
    />

    <PickEntity
        v-if="currentView === 'entity'"
        :modelValue="modelValue"
        :domain="currentDomain"
        @picked="entityPicked"
    />
    <PickService
        v-if="currentView === 'service'"
        :modelValue="modelValue"
        @picked="servicePicked"
    />
</template>
