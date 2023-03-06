const translate = AnimatedJava.translate
const PATHJS = PathModule
const formatStr = AnimatedJava.formatStr

export {}

const TRANSLATIONS = {
	datapack_folder: {
		name: translate('animated_java.exporters.animation_exporter.settings.datapack_folder'),
		description: translate(
			'animated_java.exporters.animation_exporter.settings.datapack_folder.description'
		).split('\n'),
	},
}

new AnimatedJava.Exporter({
	id: 'animated_java:animation_exporter',
	name: translate('animated_java.exporters.animation_exporter.name'),
	description: translate('animated_java.exporters.animation_exporter.description'),
	getSettings() {
		return {
			datapack_folder: new AnimatedJava.Settings.FolderSetting({
				id: 'animated_java:animation_exporter/datapack_folder',
				displayName: TRANSLATIONS.datapack_folder.name,
				description: TRANSLATIONS.datapack_folder.description,
				defaultValue: '',
			}),
		}
	},
	settingsStructure: [
		{
			type: 'setting',
			id: 'animated_java:animation_exporter/datapack_folder',
		},
	],
	export(ajSettings, projectSettings, exporterSettings, renderedAnimations, rig) {
		if (!Project?.animated_java_variants) throw new Error('No variants found')
		console.log(ajSettings, projectSettings, exporterSettings, renderedAnimations, rig)
		//--------------------------------------------
		// Imports
		//--------------------------------------------
		const { NbtCompound, NbtString, NbtList, NbtInt } = AnimatedJava.deepslate
		const NAMESPACE = projectSettings.project_namespace.value
		const RIG_ITEM = projectSettings.rig_item.value
		const variants = Project.animated_java_variants

		//--------------------------------------------
		// Data Pack
		//--------------------------------------------

		const scoreboard = {
			i: 'aj.i',
			id: 'aj.id',
		}
		const tags = {
			new: 'aj.new',
			root_entity: `aj.${NAMESPACE}.root`,
			bone_entity: `aj.${NAMESPACE}.bone.%s`,
		}

		const datapack = new AnimatedJava.VirtualFileSystem.VirtualFolder(NAMESPACE)
		const dataFolder = datapack.newFolder('data')

		//--------------------------------------------
		// tags/functions
		//--------------------------------------------

		const functionTagFolder = dataFolder.newFolder('minecraft/tags/functions')
		functionTagFolder.newFile('load.json', {
			replace: false,
			values: [`${NAMESPACE}:animated_java/load`],
		})
		functionTagFolder.newFile('tick.json', {
			replace: false,
			values: [`${NAMESPACE}:animated_java/tick`],
		})

		const [namespaceFolder, animatedJavaFolder] = dataFolder.newFolders(
			NAMESPACE,
			'animated_java'
		)
		namespaceFolder.newFolders('functions', 'tags')
		animatedJavaFolder.newFolders('functions', 'tags', 'item_modifiers')

		//--------------------------------------------
		// load/tick functions
		//--------------------------------------------

		animatedJavaFolder
			.accessFolder('functions')
			.chainNewFile('load.mcfunction', [
				Object.values(scoreboard).map(s => `scoreboard objectives add ${s} dummy`),
				`scoreboard players add .aj.last_id ${scoreboard.id} 0`,
			])
			.chainNewFile('tick.mcfunction', [])

		//--------------------------------------------
		// entity_type tags
		//--------------------------------------------

		namespaceFolder
			.newFolder('tags/entity_types')
			.chainNewFile('root_entities.json', {
				replace: false,
				values: ['minecraft:item_display'],
			})
			.chainNewFile('bone_entities.json', {
				replace: false,
				values: ['minecraft:item_display'],
			})

		//--------------------------------------------
		// NAMESPACE:summon function
		//--------------------------------------------

		const summonNbt = new NbtCompound()
		summonNbt.set(
			'Tags',
			new NbtList([new NbtString(tags.new), new NbtString(tags.root_entity)])
		)

		const passengers = new NbtList()
		for (const bone of Object.values(rig.boneMap)) {
			const passenger = new NbtCompound()
				.set('id', new NbtString('minecraft:item_display'))
				.set(
					'Tags',
					new NbtList([
						new NbtString(tags.new),
						new NbtString(formatStr(tags.bone_entity, [bone.name])),
					])
				)
				.set(
					'item',
					new NbtCompound()
						.set('id', new NbtString(RIG_ITEM))
						.set('Count', new NbtString('1'))
						.set(
							'tag',
							new NbtCompound().set(
								'CustomModelData',
								new NbtInt(bone.customModelData)
							)
						)
				)
			passengers.add(passenger)
		}
		summonNbt.set('Passengers', passengers)

		namespaceFolder
			.accessFolder('functions')
			.chainNewFile('summon.mcfunction', [
				`summon minecraft:item_display ~ ~ ~ ${summonNbt.toString()}`,
				`execute as @e[type=minecraft:item_display,limit=1,distance=..1,tag=${tags.new}] run function ${NAMESPACE}:animated_java/summon`,
			])
		animatedJavaFolder
			.accessFolder('functions')
			.chainNewFile('summon.mcfunction', [
				`execute store result score @s ${scoreboard.id} run scoreboard players add .aj.last_id ${scoreboard.id} 1`,
				`execute on passengers run function ${NAMESPACE}:animated_java/on_new_bone`,
				`tag @s remove ${tags.new}`,
			])
			.chainNewFile('on_new_bone.mcfunction', [
				`scoreboard players operation @s ${scoreboard.id} = .aj.last_id ${scoreboard.id}`,
			])

		return datapack
	},
})
