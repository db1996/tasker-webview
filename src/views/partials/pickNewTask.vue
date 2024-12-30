<script lang="ts" setup>
import BaseButton from '@/components/BaseButton.vue'
import MdiIcon from '@/components/MdiIcon.vue'
import actionSpecCard from '@/helpers/homeView/actionSpecCard'
import { useTaskerClient } from '@/stores/useTaskerClient'
import type { CategorySpec } from '@/tasker/types/CategorySpec'
import ActionSpec from '@/tasker/types/specs/ActionSpec'
import { forEach } from 'lodash'

const emit = defineEmits(['picked'])

const taskerClient = useTaskerClient().taskerClient

import { ref, onMounted, computed } from 'vue'

const actionSpecs = ref<ActionSpec[]>([])
const categorySpecs = ref<CategorySpec[]>([])
const allCards = ref<actionSpecCard[]>([])
const currentSearchCard = ref<actionSpecCard | null>(null)
const searchStr = ref('')
const topCards = ref<actionSpecCard[]>([])

onMounted(async () => {
    actionSpecs.value = (await taskerClient?.getActionSpecs()) ?? []
    categorySpecs.value = (await taskerClient?.getCategorySpecs()) ?? []

    const homeAssistantCard = new actionSpecCard()
    homeAssistantCard.name = 'Home Assistant'
    homeAssistantCard.code = 339
    homeAssistantCard.bgColor = 'bg-success'
    homeAssistantCard.icon = 'home-assistant'
    homeAssistantCard.type = 'plugin'
    homeAssistantCard.plugin = 'Home Assistant'

    topCards.value.push(homeAssistantCard)
    forEach(actionSpecs.value, (actionSpec) => {
        const card = new actionSpecCard()
        card.code = actionSpec.code
        card.name = actionSpec.name
        card.categoryCode = actionSpec.categoryCode
        card.icon = categoryCodeToIcon(actionSpec.categoryCode)
        allCards.value.push(card)
    })
})

const activeCards = computed(() => {
    const searchStrLower = searchStr.value.toLowerCase()

    const cards: actionSpecCard[] = []
    const filteredCards: actionSpecCard[] = topCards.value.filter((card) => {
        if (searchStrLower !== '') {
            return card.name.toLowerCase().includes(searchStrLower) || searchStrLower === ''
        }

        if (currentSearchCard.value) {
            return card.categoryCode === currentSearchCard.value.code
        }
    })

    allCards.value.forEach((card) => {
        if (
            searchStrLower !== '' &&
            (card.name.toLowerCase().includes(searchStrLower) || searchStrLower === '')
        ) {
            filteredCards.push(card)
            return
        }
        if (currentSearchCard.value && card.categoryCode === currentSearchCard.value.code) {
            filteredCards.push(card)
            return
        }
    })

    const categoryCards = categorySpecs.value.map((categorySpec) => {
        const card = new actionSpecCard()
        card.name = categorySpec.name
        card.type = 'filter'
        card.code = categorySpec.code
        card.icon = categoryCodeToIcon(categorySpec.code)
        return card
    })

    if (currentSearchCard.value !== null || searchStrLower !== '') {
        cards.push(...filteredCards)
    } else {
        cards.push(...topCards.value)
        cards.push(...categoryCards)
    }

    return cards
})

function categoryCodeToIcon(code: number) {
    switch (code) {
        case 10: //alert
            return 'alert'
        case 15: // app
            return 'apps'
        case 20: // audio
            return 'volume-high'
        case 35: // code
            return 'view-list'
        case 40: // display
            return 'cellphone-dock'
        case 50: // file
            return 'folder'
        case 51: // google drive
            return 'google-drive'
        case 52: // image
            return 'crop'
        case 55: // input
            return 'mouse'
        case 60: // location
            return 'flag'
        case 141: // matter home automation
            return 'home-automation'
        case 65: // media
            return 'camera'
        case 80: // net
            return 'swap-vertical'
        case 90: // phone
            return 'phone'
        case 100: // plugin
            return 'power-plug'
        case 102: // scene
            return 'image-area'
        case 30: // settings
            return 'cog'
        case 104: // system
            return 'server'
        case 105: // task
            return 'format-list-numbered'
        case 110: // tasker
            return 'lightning-bolt'
        case 120: // variables
            return 'tag'
        case 125: // zoom
            return 'magnify-plus'
        case 130: // 3rd party
            return 'account-multiple-plus'
        default:
            return ''
    }
}

function click(card: actionSpecCard) {
    if (card.type === 'action' || card.type === 'plugin') {
        emit('picked', card)
    } else if (card.type === 'filter') {
        currentSearchCard.value = card
        searchStr.value = ''
    }
}

function resetSearch() {
    currentSearchCard.value = null
    searchStr.value = ''
}
</script>

<template>
    <div class="row">
        <div class="col-7">
            <div class="input-group mb-3">
                <input
                    ref="searchInp"
                    type="text"
                    class="form-control"
                    name="search"
                    @input="searchStr = ($event.target as HTMLInputElement).value"
                />
                <span class="input-group-text" id="basic-addon1"><MdiIcon icon="magnify" /></span>
            </div>
        </div>
        <div class="col-4">
            <p>Category: {{ currentSearchCard?.name }}</p>
        </div>
        <div class="col-1">
            <BaseButton
                @click="resetSearch"
                :btn-class="'btn-secondary'"
                icon-left="close"
                v-tooltip
                data-title="Empty search"
            />
        </div>
    </div>
    <ul class="list-group">
        <li
            v-for="(value, key) in activeCards"
            class="list-group-item hover-active"
            :class="value.bgColor"
            :key="key"
            @click="click(value)"
        >
            <div class="row">
                <div class="col-1">
                    <MdiIcon :icon="value.icon" />
                </div>
                <div class="col-11">
                    <div class="fw-bold">{{ value.name }}</div>
                </div>
            </div>
        </li>
    </ul>
</template>
