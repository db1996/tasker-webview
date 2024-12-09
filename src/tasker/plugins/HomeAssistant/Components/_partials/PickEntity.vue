<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { onMounted, ref, type PropType } from 'vue'
import type HomeAssistantPlugin from '../../HomeAssistantPlugin'
import type { HaEntity } from '../../types/HaEntity'
import MdiIcon from '@/components/MdiIcon.vue'
import { forEach } from 'lodash'

defineEmits(['picked'])
const props = defineProps({
    modelValue: Object as PropType<HomeAssistantPlugin>,
    domain: String,
})

const client = props.modelValue?.client

const entities = ref<HaEntity[] | null>(null)
const resultEntities = ref<HaEntity[] | null>(null)

onMounted(async () => {
    const entitiesData = await client?.getEntities(props.domain)
    if (entitiesData) {
        entities.value = entitiesData
    }

    resultEntities.value = entities.value
})

function getFriendlyName(entity: HaEntity) {
    return entity.attributes?.friendly_name ?? ''
}

function getIcon(entity: HaEntity) {
    const iconVal = entity.attributes?.icon ?? ''

    if (iconVal.startsWith('mdi:')) {
        return iconVal.replace('mdi:', '')
    }

    switch (entity.entity_id?.split('.')[0]) {
        case 'light':
            return 'lightbulb'
        case 'switch':
            return 'toggle-switch'
        case 'sensor':
            return 'thermometer'
        case 'binary_sensor':
            return 'motion-sensor'
        case 'media_player':
            return 'speaker'
        case 'climate':
            return 'thermostat'
        case 'cover':
            return 'window-shutter'
        case 'fan':
            return 'fan'
        case 'input_boolean':
            return 'toggle-switch'
        case 'input_number':
            return 'numeric-10'
        case 'input_select':
            return 'format-list-bulleted'
        case 'input_text':
            return 'textbox'
        case 'input_datetime':
            return 'calendar'
        case 'automation':
            return 'robot'
        case 'script':
            return 'script-text'
        case 'scene':
            return 'palette'
    }

    return ''
}

function searchEntities(ev: string) {
    resultEntities.value = []
    forEach(entities.value, (entity) => {
        let friendlyName = ''
        let id = ''
        if (entity.attributes) {
            friendlyName = entity.attributes.friendly_name ?? ''
            id = entity.entity_id?.split('.')[1] ?? ''
        }
        if (
            friendlyName.toLowerCase().includes(ev.toLowerCase()) ||
            id.toLowerCase().includes(ev.toLowerCase())
        ) {
            resultEntities.value?.push(entity)
        }
    })
}
</script>
<template>
    <StaticElement name="">
        <template #default>
            <p>Domain: {{ domain }}</p>
        </template>
    </StaticElement>
    <TextElement
        :submit="false"
        name="search"
        label="Search"
        @change="searchEntities"
        :default="''"
    />
    <StaticElement name="">
        <template #default>
            <ul class="list-group">
                <li
                    class="list-group-item hover-active"
                    @click="() => $emit('picked', value)"
                    v-for="(value, key) in resultEntities"
                    :key="key"
                >
                    <div class="row">
                        <div class="col-1">
                            <MdiIcon :icon="getIcon(value)" />
                        </div>
                        <div class="col-11">
                            <div class="fw-bold">{{ getFriendlyName(value) }}</div>
                            {{ value.entity_id?.toString() }}
                        </div>
                    </div>
                </li>
            </ul>
        </template>
    </StaticElement>
</template>
