import {
    ShaderGradient,
    ShaderGradientCanvas,
} from '@shadergradient/react'

function HeroGradient() {
    return (
        <div className="hero-gradient">
            <ShaderGradientCanvas
                style={{
                    position: 'absolute',
                    inset: 0,
                }}
                pixelDensity={1.5}
                fov={45}
            >
                <ShaderGradient
                    type="sphere"
                    animate="on"

                    color1="#7c3aed"
                    color2="#6366f1"
                    color3="#22d3ee"

                    uSpeed={0.25}
                    uStrength={1.5}
                    uDensity={1.2}
                    uFrequency={2.5}

                    brightness={1.1}
                    reflection={0.4}

                    lightType="3d"
                    envPreset="city"

                    cameraZoom={1.5}

                    rotationX={0}
                    rotationY={0}
                    rotationZ={0}
                />
            </ShaderGradientCanvas>
        </div>
    )
}

export default HeroGradient