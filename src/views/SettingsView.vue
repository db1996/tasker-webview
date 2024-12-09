<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { taskerStoreError } from '@/tasker/enums/taskerStoreError'
import { computed, onMounted, ref } from 'vue'
import { Validator } from '@vueform/vueform'
import MdiIcon from '@/components/MdiIcon.vue'
import { useCookies } from 'vue3-cookies'
import { HomeAssistantClient } from '@/tasker/plugins/HomeAssistant/HomeAssistantClient'
import TaskerClient from '@/tasker/TaskerClient'

const { cookies } = useCookies()

const settingForm = ref()
const isLoading = ref(false)

const homeAssistantClient = ref(new HomeAssistantClient())
const taskerClient = ref<TaskerClient>(new TaskerClient())

onMounted(async () => {
    await homeAssistantClient.value.ping()
    settingForm.value?.update({
        tasker_url: taskerClient.value.url,
        homeassistant_url: homeAssistantClient.value.baseUrl,
        homeassistant_token: homeAssistantClient.value.accessToken,
    })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function onSubmit(FormData: any, form$: any) {
    isLoading.value = true
    const data = form$.data

    if (data.tasker_url) {
        await taskerClient.value.setUrl(data.tasker_url)
        if (taskerClient.value.error === taskerStoreError.OK) {
            cookies.set('tasker_url', data.tasker_url, '365d')
        }
    }

    if (data.homeassistant_url && data.homeassistant_token) {
        homeAssistantClient.value.setUrl(data.homeassistant_url)
        homeAssistantClient.value.setToken(data.homeassistant_token)
        await homeAssistantClient.value.ping()

        if (homeAssistantClient.value.error.length === 0) {
            cookies.set('homeassistant_url', data.homeassistant_url, '365d')
            cookies.set('homeassistant_token', data.homeassistant_token, '365d')
        }
    }

    isLoading.value = false
}

const submitForm = async () => {
    if (settingForm.value) {
        await settingForm.value.submit()
    }
}

const isUrl = class extends Validator {
    get msg() {
        return 'The URL field must be a valid URL, it has to start with http:// or https://'
    }
    async check(value: string) {
        if (!/^(http|https):\/\/[^ "]+/.test(value)) {
            return false
        }

        await taskerClient.value.setUrl(value)
        return taskerClient.value.error === taskerStoreError.OK && taskerClient.value.ping
    }
}

const taskerStatus = computed(() => {
    let ret = {
        text: 'Waiting for input',
        text_class: '',
        icon: 'clock',
        spin: false,
    }

    if (taskerClient.value.error === taskerStoreError.OK && taskerClient.value.ping) {
        ret = {
            text: taskerClient.value.error,
            text_class: 'text-success',
            icon: 'check-circle',
            spin: false,
        }
    }
    if (
        taskerClient.value.error === taskerStoreError.NO_CONNECT ||
        taskerClient.value.error === taskerStoreError.NO_URL
    ) {
        ret = {
            text: taskerClient.value.error,
            text_class: 'text-danger',
            icon: 'alert',
            spin: false,
        }
    }

    if (taskerClient.value.isRunning) {
        ret.icon = 'loading'
        ret.spin = true
    }

    return ret
})

const homeAssistantStatus = computed(() => {
    let ret = {
        text: 'Waiting for input',
        text_class: '',
        icon: 'clock',
    }

    if (homeAssistantClient.value.pingStatus) {
        ret = {
            text: 'Successfully connected to Home Assistant',
            text_class: 'text-success',
            icon: 'check-circle',
        }
    } else {
        if (homeAssistantClient.value.error.length === 0) {
            ret = {
                text: 'Waiting for input',
                text_class: '',
                icon: 'clock',
            }
        }
        ret = {
            text: homeAssistantClient.value.error,
            text_class: 'text-danger',
            icon: 'alert',
        }
    }

    if (homeAssistantClient.value.isRunning) {
        ret.icon = 'loading'
    }

    return ret
})
</script>

<template>
    <MainLayout title="Settings">
        <template #actions>
            <BaseButton
                :btnClass="'btn-primary'"
                icon-left="content-save"
                sm
                @click="submitForm"
                :loading="isLoading"
            />
        </template>
        <template #default>
            <Vueform
                ref="settingForm"
                validate-on="change"
                :display-errors="false"
                :endpoint="onSubmit"
            >
                <StaticElement name="static">
                    <div class="row">
                        <div class="col d-flex">
                            <h4>Tasker</h4>
                        </div>
                        <div class="col-8 d-flex justify-content-end align-items-center">
                            <p class="mb-0 me-2" :class="taskerStatus.text_class">
                                {{ taskerStatus.text }}
                            </p>
                            <MdiIcon :icon="taskerStatus.icon" :spin="taskerStatus.spin" />
                        </div>
                    </div>
                </StaticElement>
                <TextElement
                    name="tasker_url"
                    label="Your URL for tasker WebUI"
                    field-name="URL"
                    :rules="[isUrl, 'required']"
                />
                <StaticElement name="static">
                    <div class="row">
                        <div class="col d-flex">
                            <h4>Home Assistant</h4>
                        </div>
                        <div class="col-8 d-flex justify-content-end align-items-center">
                            <p class="mb-0 me-2" :class="homeAssistantStatus.text_class">
                                {{ homeAssistantStatus.text }}
                            </p>
                            <MdiIcon :icon="homeAssistantStatus.icon" />
                        </div>
                    </div>
                </StaticElement>
                <TextElement
                    name="homeassistant_url"
                    label="Your home assistant url"
                    placeholder="ex: http://homeassistant.local:8123"
                    field-name="URL"
                    :rules="['required']"
                />
                <TextareaElement
                    name="homeassistant_token"
                    label="Your home assistant access token"
                    field-name="token"
                    :rules="['required']"
                />
            </Vueform>
        </template>
    </MainLayout>
</template>
