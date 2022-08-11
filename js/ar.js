/*XR Light*/

AFRAME.registerSystem('xr-light',
    {
        init() {
            this.intensity = 1
            const startListen = () => {
                window.XR8.XrController.configure({ enableLighting: true })
                window.XR8.addCameraPipelineModule({
                    name: 'xr-light',
                    onUpdate: ({ processCpuResult }) => {
                        if (processCpuResult.reality &&
                            processCpuResult.reality.lighting &&
                            processCpuResult.reality.lighting.exposure) {
                            this.intensity = 1 + processCpuResult.reality.lighting.exposure
                        }
                    },
                })
            }
            window.XR8 ? startListen() : window.addEventListener('xrloaded', startListen)
        },
    })

AFRAME.registerComponent('xr-light',
    {
        schema: {
            min: { default: 0 },
            max: { default: 2 },
        },
        tick() {
            this.el.setAttribute(
                'light',
                `intensity: ${Math.max(this.data.min, Math.min(this.system.intensity, this.data.max))}`
            )
        },
    })

/*Cupemap Realtime*/

const ensureMaterialArray = (material) => {
    if (!material) {
        return []
    }
    if (Array.isArray(material)) {
        return material
    }
    if (material.materials) {
        return material.materials
    }
    return [material]
}
const applyEnvMap = (mesh, envMap) => {
    if (!mesh) return
    mesh.traverse((node) => {
        if (!node.isMesh) {
            return
        }
        const meshMaterials = ensureMaterialArray(node.material)
        meshMaterials.forEach((material) => {
            if (material && !('envMap' in material)) return
            material.envMap = envMap
            material.needsUpdate = true
        })
    })
}
AFRAME.registerComponent('cubemap-realtime', {
    schema: {},
    init() {
        const { data } = this
        const scene = this.el.sceneEl
        const camTexture_ = new THREE.Texture()
        const refMat = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0xffffff,
            map: camTexture_,
        })
        const renderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            encoding: THREE.sRGBEncoding,
        })
        // cubemap scene
        const cubeMapScene = new THREE.Scene()
        const cubeCamera = new THREE.CubeCamera(1, 1000, renderTarget)
        const sphere = new THREE.SphereGeometry(100, 15, 15)
        const sphereMesh = new THREE.Mesh(sphere, refMat)
        sphereMesh.scale.set(-1, 1, 1)
        sphereMesh.rotation.set(Math.PI, -Math.PI / 2, 0)
        cubeMapScene.add(sphereMesh)
        window.XR8.XrController.configure({ enableLighting: true })
        window.XR8.addCameraPipelineModule({
            name: 'cubemap-process',
            onUpdate: () => {
                cubeCamera.update(scene.renderer, cubeMapScene)
            },
            onProcessCpu: ({ frameStartResult }) => {
                const { cameraTexture } = frameStartResult
                // force initialization
                const texProps = scene.renderer.properties.get(camTexture_)
                texProps.__webglTexture = cameraTexture
            },
        })
        this.el.addEventListener('model-loaded', () => {
            applyEnvMap(this.el.getObject3D('mesh'), cubeCamera.renderTarget.texture)
        })
    },
})

AFRAME.registerComponent('next-button', {
    init() {
      const full = document.getElementById('full_m')
      const leoOnly = document.getElementById('leoOnly_m')

      const nextButton = document.getElementById('nextbutton')

      nextButton.style.display = 'block'
      const nextView = () => {
        if (full.getAttribute('visible') == true) {
            full.setAttribute('visible', 'false')
            leoOnly.setAttribute('visible', 'true')
            nextButton.innerHTML = 'Show Entire Biosphere 2'
        }
        else {
            full.setAttribute('visible', 'true')
            leoOnly.setAttribute('visible', 'false')
            nextButton.innerHTML = 'Show LEO Only'
        }
      }
      nextButton.onclick = nextView 
    },
})