#version 300 es

precision mediump float;

uniform sampler2D u_colorTexture;

uniform sampler2D u_depthTexture;

uniform sampler2D u_bloomTexture;

// Camera "focus" is defined by a near and far distance.
// Everything between the near and far distance are "in focus" (i.e., sharp).
// Everything closer than the near distance, or farther than the far distance,
// are gradually blurred more and more.
uniform float u_focusNear;
uniform float u_focusFar;

in vec2 v_texCoord;

out vec4 outputColor;

void main() {
    // Get the depth at current pixel
    float depth = texture(u_depthTexture, v_texCoord).r;

    // Linearize the depth
    // Make sure these values are the same as in camera setup.
    float zNear = 0.1;
    float zFar = 1000.0;
    float linearDepth = zNear / (zFar + depth * (zNear - zFar));

    // Determine the blur distance
    float nearBlur = max(0.0, 5.0 * (u_focusNear/zFar - linearDepth));
    float farBlur = max(0.0, 0.1 * (linearDepth - u_focusFar/zFar));
    float blurDistance = max(nearBlur, farBlur);

    // Blur scale factor
    // The rate that blur increases with distance
    float blurScale = 0.1;

    // Max blur radius in screen units (i.e., 1.0 = width of the screen)
    float maxBlur = 0.03;

    // Now calculate the actual blur size
    //float blurSize = clamp(abs(linearDepth - (u_focusDistance / zFar)) * 0.1, 0.0, maxBlur);
    float blurSize = clamp(blurDistance * blurScale, 0.0, maxBlur);
    vec4 color = texture(u_colorTexture, v_texCoord);
    float samples = 1.0;
    for (float theta = 0.0; theta < 6.28; theta += 0.6) {
        vec2 neighbor = v_texCoord + blurSize * vec2(cos(theta), sin(theta));
        float neighborDepth = texture(u_depthTexture, neighbor).r;
        float neighborLinearDepth = zNear / (zFar + neighborDepth * (zNear - zFar));
        if (neighborLinearDepth >= linearDepth - 0.1) {
            color += texture(u_colorTexture, neighbor);
            samples += 1.0;
        }
    }
    // outputColor = vec4(color.rgb / samples, 1);

    
    // vec4 color = texture(u_colorTexture, v_texCoord);

    // Finally, combine the bloom output with the depth of field blur
    vec4 bloomColor = texture(u_bloomTexture, v_texCoord);
    // outputColor = vec4(color.rgb + 2.0 * bloomColor.a * bloomColor.rgb, 1);
    outputColor = vec4(color.rgb / samples + 2.0 * bloomColor.a * bloomColor.rgb, 1);
}
