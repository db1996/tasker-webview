<script setup lang="ts">
import type { PropType } from 'vue'
import BaseActionType from '../BaseActionType'
import { ActionTypeSpec } from '@/tasker/enums/ActionTypeSpec'

defineProps({
    modelValue: Object as PropType<BaseActionType>,
})
</script>
<template>
    <GroupElement name="defaultForm">
        <template v-for="(arg, index) in modelValue?.action.actionSpec?.args" :key="index">
            <TextElement
                v-if="arg.type === ActionTypeSpec.STRING"
                :name="'arg_' + arg.id"
                :label="arg.name"
                :field-name="'arg_' + arg.id"
                :default="
                    (modelValue?.action.args.find((a) => a.id === arg.id)?.value as string) ?? ''
                "
            />
            <TextElement
                v-else-if="arg.type === ActionTypeSpec.INT"
                input-type="number"
                :name="'arg_' + arg.id"
                :label="arg.name"
                :field-name="'arg_' + arg.id"
                :default="
                    (modelValue?.action.args.find((a) => a.id === arg.id)?.value as number) ?? ''
                "
            />
            <ToggleElement
                v-else-if="arg.type === ActionTypeSpec.BOOLEAN"
                :name="'arg_' + arg.id"
                :label="arg.name"
                :field-name="'arg_' + arg.id"
                :default="
                    (modelValue?.action.args.find((a) => a.id === arg.id)?.value as boolean) ??
                    false
                "
            />
            <StaticElement v-else-if="arg.type == ActionTypeSpec.BUNDLE" :name="arg.name" />

            <TextElement
                v-else
                name=""
                :label="arg.name"
                field-name=""
                default=""
                disabled
                :placeholder="'Argument is of type: ' + ActionTypeSpec[arg.type].toLowerCase()"
            />
        </template>
    </GroupElement>
</template>
