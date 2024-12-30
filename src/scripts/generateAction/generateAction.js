#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */

import fs from 'fs'
import path from 'path'
import { program } from 'commander'
import inquirer from 'inquirer'

// ESM-compatible __dirname workaround
import { fileURLToPath } from 'url'
import { exit } from 'process'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATES = {
    ts: path.join(__dirname, './templates/actionTypeTemplate.ts'),
    vue: path.join(__dirname, './templates/actionTypeFormTemplate.vue')
}

const config = {
    template_dir: path.join(__dirname, './templates'),
    output_dir: path.join(__dirname, '../../tasker/actionTypes'),
    manager_path: path.join(__dirname, '../../tasker/helpers/ActionTypeManager.ts'),
    manager_base_import: './../actionTypes/'
}

let replaceVars = [
    {
        replace_value: 'ACTIONTYPE_NAME',
        value: '',
        type: 'string',
        required: true,
        camelCase: true,
        option_name: 'action_name',
        option_question: 'Action name (CamelCase)',
        option_cli: '-a, --action_name <actiontype_name>'
    },
    {
        replace_value: 'TASKER_CODE',
        value: '',
        type: 'number',
        required: true,
        option_name: 'tasker_code',
        option_question: 'Tasker code (check json)',
        option_cli: '-c, --tasker_code <tasker_code>'
    },
    {
        replace_value: 'TASKER_NAME',
        value: '',
        type: 'string',
        required: true,
        option_name: 'tasker_name',
        option_question: 'Tasker name (check json)',
        option_cli: '-t, --tasker_name <tasker_name>'
    },
    {
        replace_value: 'ACTIONTYPE_SHOW_ARGS',
        value: false,
        type: 'boolean',
        required: false,
        option_name: 'show_args',
        option_question: 'Show action arguments in the index view',
        option_cli: '-sa, --show_args'
    },
    {
        replace_value: 'TS_FILENAME',
        value: '',
        type: 'string',
        required: false
    },
    {
        replace_value: 'VUE_FILENAME',
        value: '',
        type: 'string',
        required: false
    }
]
for (const [index, option] of replaceVars.entries()) {
    if (option.hasOwnProperty('option_question') && option.hasOwnProperty('option_cli')) {
        program.option(option.option_cli, option.option_question)
    }
}

program.parse()

const options = program.opts()

// // Update the replaceVars array with the parsed options
for (const [index, option] of replaceVars.entries()) {
    for (const [key, value] of Object.entries(options)) {
        if (key === option.option_name) {
            replaceVars[index].value = value
        }
    }
}

async function promptForMissingOptions () {
    const questions = []
    for (const [index, option] of replaceVars.entries()) {
        if (option.required && !option.value) {
            questions.push({
                type: 'input',
                name: option.replace_value,
                message: option.option_question
            })
        }
    }

    const answers = await inquirer.prompt(questions)
    for (const [index, option] of replaceVars.entries()) {
        if (answers[option.replace_value]) {
            if (option.type === 'number') {
                answers[option.replace_value] = parseInt(answers[option.replace_value])
            }
            if (option.type === 'boolean') {
                answers[option.replace_value] = answers[option.replace_value] === 'true'
            }
            if (option.camelCase) {
                answers[option.replace_value] =
                    answers[option.replace_value].charAt(0).toUpperCase() +
                    answers[option.replace_value].slice(1)
            }
            option.value = answers[option.replace_value]
        }
    }

    for (const [index, option] of replaceVars.entries()) {
        if (option.replace_value === 'TS_FILENAME') {
            console.log('options:', option.replace_value)

            option.value = options.action_name + 'ActionType'
        }
        if (option.replace_value === 'VUE_FILENAME') {
            option.value = options.action_name + 'Form'
        }
    }
}

function populateTemplate (template) {
    for (const [index, option] of replaceVars.entries()) {
        if (option.value) {
            template = template.replace(
                new RegExp('{{' + option.replace_value + '}}', 'g'),
                option.value
            )
        }
    }

    return template
}

function getKeyValueFromReplacevars () {
    let keyValues = {}
    for (const [index, option] of replaceVars.entries()) {
        keyValues[option.replace_value] = option.value ?? ''
    }
    return keyValues
}

async function generateFiles () {
    await promptForMissingOptions()
    const keyValues = getKeyValueFromReplacevars()

    const actionTypeDir = path.join(config.output_dir, keyValues.ACTIONTYPE_NAME)
    const tsFile = path.join(actionTypeDir, `${keyValues.TS_FILENAME}.ts`)
    const vueFile = path.join(actionTypeDir, `${keyValues.VUE_FILENAME}.vue`)

    fs.mkdirSync(actionTypeDir, { recursive: true })

    // Generate TypeScript file
    const tsTemplate = fs.readFileSync(TEMPLATES.ts, 'utf8')
    fs.writeFileSync(tsFile, populateTemplate(tsTemplate).trim())

    // Generate Vue file
    const vueTemplate = fs.readFileSync(TEMPLATES.vue, 'utf8')
    fs.writeFileSync(vueFile, populateTemplate(vueTemplate).trim())

    console.log(`Created ${tsFile} and ${vueFile}`)

    const managerImport = `${config.manager_base_import}${keyValues.ACTIONTYPE_NAME}/${keyValues.TS_FILENAME}`
    const importLine = `import('${managerImport}'),`
    addImportToManager(importLine)

    console.log('Done!')
}

function addImportToManager (newImport) {
    // Read the ActionTypeManager file
    const fileContents = fs.readFileSync(config.manager_path, 'utf8')

    // Find the position of the placeholder comment
    const placeholderIndex = fileContents.indexOf('// {{ADDIMPORT}}')

    if (placeholderIndex === -1) {
        console.error('Placeholder comment not found in the file.')
        return
    }

    // Add the new import before the placeholder comment
    const newContents = `${fileContents.slice(
        0,
        placeholderIndex
    )}${newImport}\n            ${fileContents.slice(placeholderIndex)}`

    // Write the updated content back to the file
    fs.writeFileSync(config.manager_path, newContents, 'utf8')

    console.log('Import added successfully!')
}

await generateFiles()
