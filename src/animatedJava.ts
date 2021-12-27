import { BuildModel } from './mainEntry'
import { settings } from './settings'
import * as util from './util'
import events from './constants/events'
import { format } from './modelFormat'
import { registerSettingRenderer } from './ui/dialogs/settings'
import './ui/mods/boneConfig'
import './compileLangMC'
const ANIMATED_JAVA = {
	build(callback: Function, configuration: Record<any, any>) {
		const default_configuration = {
			generate_static_animation: false,
		}
		BuildModel(
			callback,
			Object.assign(default_configuration, configuration)
		)
	},
	registerExportFunc(name: string, exportFunc: () => void) {
		util.store.getStore('exporters').set(name, exportFunc)
	},
	settings,
	util,
	store: util.store,
	format: format,
	registerSettingRenderer,
}
delete window['ANIMATED_JAVA']
Object.defineProperty(window, 'ANIMATED_JAVA', {
	value: ANIMATED_JAVA,
})
// window.ANIMATED_JAVA = ANIMATED_JAVA
util.bus.on(events.LIFECYCLE.CLEANUP, () => {
	console.log('CLEANUP')
	// @ts-ignore
	delete window.ANIMATED_JAVA
})

import './exporters/statueExporter'
import './exporters/animationExporter'
// @ts-ignore
Blockbench.dispatchEvent('animated-java-ready', ANIMATED_JAVA)
// @ts-ignore
Blockbench.events['animated-java-ready'].length = 0

// WOOO TYPING, YAAAAAAY

export interface Settings {
	animatedJava: {
		projectName: string
		exporter: string
		useCache: boolean
		cacheMode: 'memory' | 'disk'
		rigItem: string
		predicateFilePath: string
		rigModelsExportFolder: string
		transparentTexturePath: string
		boundingBoxRenderMode: 'single' | 'multiple' | 'disabled'
	}
	[index: string]: any
}

type Bone = {
	nbt: string
	can_manipulate_arms: boolean
	customModelData: number
} & Cube

export interface BoneObject {
	[index: string]: Bone
}

type AnimationFrameBone = {
	exported: boolean
	pos: { x: number; y: number; z: number }
	rot: { x: number; y: number; z: number }
	scale: { x: number; y: number; z: number }
}

type Frame = {
	bones: AnimationFrameBone[]
	scripts: any
}

type Animation = {
	frames: Frame[]
	maxDistance: number
}

export interface Animations {
	[index: string]: Animation
}

type ModelFace = {
	texture: `#${number}`
	uv: [number, number, number, number]
}

type ModelElement = {
	faces: {
		north?: ModelFace
		south?: ModelFace
		east?: ModelFace
		west?: ModelFace
		up?: ModelFace
		down?: ModelFace
	}
	rotation: {
		angle: number
		axis: 'x' | 'y' | 'z'
		origin: [number, number, number]
	}
	to: [number, number, number]
	from: [number, number, number]
	uuid?: string
}

type TextureObject = {
	[index: number]: string
	[index: `${number}`]: string
}

type Model = {
	aj: {
		customModelData: number
	}
	parent: string
	display: any
	elements: ModelElement[]
	textures: TextureObject
}

export interface ModelObject {
	[index: string]: Model
}

export interface CubeData {
	clear_elements: ModelElement[]
	element_index_lut: number[]
	invalid_rot_elements: Bone[]
	textures_used: Texture[]
}

type VariantModel = {
	aj: {
		customModelData: number
	}
	parent: string
	textures: TextureObject
}

export interface VariantModels {
	[index: string]: {
		[index: string]: VariantModel
	}
}

export interface VariantTextureOverrides {
	[index: string]: {
		[index: string]: {
			textures: TextureObject
		}
	}
}

export interface variantTouchedModels {
	[index: string]: Model
}