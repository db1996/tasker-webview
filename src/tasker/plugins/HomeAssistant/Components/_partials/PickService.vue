<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { onMounted, ref, watch, type PropType } from 'vue'
import type HomeAssistantPlugin from '../../HomeAssistantPlugin'
import MdiIcon from '@/components/MdiIcon.vue'
import type { HaService } from '../../types/HaService'
import DomainCard from '../../types/DomainCard'
import { capitalize, forEach } from 'lodash'
import BaseButton from '@/components/BaseButton.vue'

const emit = defineEmits(['picked', 'stop'])
const props = defineProps({
    modelValue: Object as PropType<HomeAssistantPlugin>,
})

const domainOrder = {
    light: {
        icon: 'lightbulb',
        friendlyName: 'Light',
    },
    script: {
        icon: 'script',
        friendlyName: 'Scripts',
    },
    automation: {
        icon: 'robot',
        friendlyName: 'Automations',
    },
    scene: {
        icon: 'palette',
        friendlyName: 'Scene',
    },
    helpers: {
        icon: 'tools',
        friendlyName: 'Helpers',
    },
    lock: {
        icon: 'lock',
        friendlyName: 'Lock',
    },
    media_player: {
        icon: 'cast',
        friendlyName: 'Media player',
    },
    notify: {
        icon: 'message',
        friendlyName: 'Notifications',
    },
    button: {
        icon: 'button-pointer',
        friendlyName: 'Button',
    },
    switch: {
        icon: 'toggle-switch-variant',
        friendlyName: 'Switch',
    },
    other: {
        icon: 'dots-horizontal',
        friendlyName: 'Other',
        other: true,
    },
}
const client = props.modelValue?.client

const currentDomain = ref('')
const currentDomainChanging = ref(false)
const services = ref<HaService[] | null>(null)
const resultServices = ref<HaService[] | null>(null)
const domainCards = ref<DomainCard[]>([])

onMounted(async () => {
    const servicesData = await client?.getServices()
    if (servicesData) {
        services.value = servicesData
    }
    initDefaultCards()
    resultServices.value = services.value
})

function initDefaultCards() {
    currentDomain.value = ''
    domainCards.value = []
    forEach(domainOrder, (value, key) => {
        const domainCard = new DomainCard()
        domainCard.domain = key
        domainCard.icon = value.icon
        domainCard.name = value.friendlyName

        domainCards.value.push(domainCard)
    })
}

function searchServices(search_str: string) {
    console.log(search_str)
    if (search_str.length === 0) {
        initDefaultCards()
        return
    }

    const domainOrderKeys = Object.keys(domainOrder).filter((key) => key !== 'other')
    domainCards.value = []
    forEach(services.value, (domainServices) => {
        if (
            domainServices.domain === currentDomain.value ||
            (currentDomain.value === 'other' &&
                !domainOrderKeys.includes(domainServices.domain ?? '')) ||
            currentDomain.value.length === 0
        ) {
            forEach(domainServices.services, (service, key) => {
                const domainCard = new DomainCard()
                domainCard.domain = domainServices.domain ?? ''
                domainCard.name =
                    capitalize(domainServices.domain ?? '') + ': ' + (service.name ?? '')
                domainCard.description = service.description ?? ''
                domainCard.service = key.toString()

                const dom = domainServices.domain ?? ''
                if (domainOrderKeys.includes(dom)) {
                    forEach(domainOrder, (value, key) => {
                        if (key === dom) {
                            domainCard.icon = value.icon
                        }
                    })
                }
                if (
                    domainCard.name.toLowerCase().includes(search_str.toLowerCase()) ||
                    domainCard.description.toLowerCase().includes(search_str.toLowerCase())
                ) {
                    domainCards.value.push(domainCard)
                }
            })
        }
    })
}

function domainInputChanged(domain: string) {
    forEach(services.value, (domainServices) => {
        if (domainServices.domain === domain) {
            currentDomain.value = domain
        }
    })
}

function clickCard(domainCard: DomainCard) {
    domainCards.value = []
    if (domainCard.service) {
        emit('picked', { domain: domainCard.domain, service: domainCard.service })
    } else {
        currentDomain.value = domainCard.domain
    }
}
watch(currentDomain, (newDomain) => {
    currentDomainChanging.value = true
    if (newDomain !== 'other') {
        forEach(services.value, (domainServices) => {
            if (domainServices.domain === newDomain) {
                domainCards.value = []
                forEach(domainServices.services, (service, key) => {
                    const domainCard = new DomainCard()
                    domainCard.domain = domainServices.domain ?? ''
                    domainCard.name = service.name ?? ''
                    forEach(domainOrder, (value, key) => {
                        if (key === domainServices.domain) {
                            domainCard.icon = value.icon
                        }
                    })
                    domainCard.description = service.description ?? ''
                    domainCard.service = key.toString()

                    domainCards.value.push(domainCard)
                })
            }
        })
    } else {
        const keystoCheck = domainCards.value.map((card) => card.domain)
        domainCards.value = []
        forEach(services.value, (domainServices) => {
            if (!keystoCheck.includes(domainServices.domain ?? '')) {
                const domainCard = new DomainCard()
                domainCard.domain = domainServices.domain ?? ''
                domainCard.name = domainServices.domain ?? ''

                domainCards.value.push(domainCard)
            }
        })
    }

    setTimeout(() => {
        currentDomainChanging.value = false
    }, 1)
})
</script>
<template>
    <GroupElement name="containerSearch">
        <TextElement
            :submit="false"
            name="search"
            label="Search"
            @change="searchServices"
            :default="''"
            :columns="{
                default: 5,
            }"
        />
        <TextElement
            v-if="!currentDomainChanging"
            :submit="false"
            name="domainFilter"
            v-model="currentDomain"
            :default="currentDomain"
            label="Domain"
            @change="domainInputChanged"
            :columns="{
                default: 5,
            }"
        />
        <ButtonElement
            name="backButton"
            label="Empty"
            @click="initDefaultCards"
            secondary
            :columns="{
                default: 1,
            }"
        >
            <MdiIcon icon="close" />
        </ButtonElement>

        <ButtonElement
            name="backButton"
            label="Back"
            @click="$emit('stop')"
            secondary
            :columns="{
                default: 1,
            }"
        >
            <MdiIcon icon="arrow-left" />
        </ButtonElement>
    </GroupElement>
    <StaticElement name="">
        <template #default>
            <ul class="list-group">
                <li
                    class="list-group-item hover-active"
                    v-for="(value, key) in domainCards"
                    @click="clickCard(value)"
                    :key="key"
                >
                    <div class="row">
                        <div class="col-1 d-flex align-items-center">
                            <MdiIcon :icon="value.icon" />
                        </div>
                        <div class="col">
                            <div class="row">
                                <div class="col">
                                    <div class="fw-bold">{{ value.name }}</div>
                                    {{ value.description }}
                                </div>
                                <div class="col-2 d-flex align-items-center justify-content-end">
                                    <BaseButton sm btn-class="btn-secondary" icon-left="plus" />
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
        </template>
    </StaticElement>
</template>
