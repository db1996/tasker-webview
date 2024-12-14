<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import HomeAssistantPlugin from '../../HomeAssistantPlugin'
import MdiIcon from '@/components/MdiIcon.vue'
import type { HaDomainService } from '../../types/HaDomainService'
import DomainCard from '../../types/DomainCard'
import { capitalize, forEach } from 'lodash'
import BaseButton from '@/components/BaseButton.vue'

const emit = defineEmits(['picked', 'stop'])

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
const client = HomeAssistantPlugin.client
const services = ref<HaDomainService[] | null>(null)
const domainCards = ref<DomainCard[]>([])

const searchInp = ref<HTMLInputElement | null>(null)
const searchDomainInp = ref<HTMLInputElement | null>(null)

onMounted(async () => {
    const servicesData = await client?.getServices()
    if (servicesData) {
        services.value = servicesData
    }
    initDefaultCards()
})

function initDefaultCards() {
    if (searchDomainInp.value) {
        searchDomainInp.value.value = ''
    }
    if (searchInp.value) {
        searchInp.value.value = ''
    }
    domainCards.value = []
    forEach(domainOrder, (value, key) => {
        const domainCard = new DomainCard()
        domainCard.domain = key
        domainCard.icon = value.icon
        domainCard.name = value.friendlyName

        domainCards.value.push(domainCard)
    })
}

function searchServices() {
    if (!searchInp.value || !searchDomainInp.value) {
        initDefaultCards()
        return
    }

    const search_str = searchInp.value.value
    const domainSearch = searchDomainInp.value.value
    const domainOrderKeys = Object.keys(domainOrder).filter((key) => key !== 'other')
    domainCards.value = []
    forEach(services.value, (domainServices) => {
        if (
            domainSearch === '' ||
            domainServices.domain === domainSearch ||
            (domainSearch === 'other' && !domainOrderKeys.includes(domainServices.domain ?? '')) ||
            domainSearch.length === 0
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

function clickCard(domainCard: DomainCard) {
    domainCards.value = []
    if (domainCard.service) {
        emit('picked', { domain: domainCard.domain, service: domainCard.service })
    } else {
        if (searchDomainInp.value) {
            searchDomainInp.value.value = domainCard.domain
        }

        searchServices()
    }
}
</script>
<template>
    <div class="row">
        <div class="col-6">
            <div class="input-group mb-3">
                <input
                    ref="searchInp"
                    type="text"
                    class="form-control"
                    name="search"
                    placeholder="Search"
                    @input="searchServices"
                />
                <span class="input-group-text" id="basic-addon1">Search</span>
            </div>
        </div>
        <div class="col-5">
            <div class="input-group mb-3">
                <input
                    ref="searchDomainInp"
                    type="text"
                    class="form-control"
                    name="domain"
                    placeholder="Domain"
                    @input="searchServices"
                />
                <span class="input-group-text" id="basic-addon1">Domain</span>
            </div>
        </div>
        <div class="col-1">
            <BaseButton
                @click="initDefaultCards"
                :btn-class="'btn-secondary'"
                icon-left="close"
                v-tooltip
                data-title="Empty search"
            />
        </div>
    </div>
    <StaticElement name="">
        <template #default>
            <ul class="list-group mt-2">
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
