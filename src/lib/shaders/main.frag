#version 300 es

precision mediump float;

uniform float u_time;

// The color texture
// uniform sampler2D u_colorTexture;

uniform vec3 u_cameraPosition;

// The shadow map texture
uniform sampler2D u_depthTexture;

// Lighting details
// Light zero is the special light, used with shadow maps
uniform vec3 u_lightPositions[16];
uniform vec3 u_lightColors[16];

// Color varying
// Simple copy of the input color
in vec4 v_color;

// Fog distance
in float v_fogDistance;

// World position
// Mesh position transformed to world position
in vec4 v_position;

// The shadow map texture coordinate
in vec4 v_shadowMapTexCoord;

// Output color
out vec4 outputColor;

void main() {

    // Emissive
  if(v_color.r > 0.99 || v_color.g > 0.99 || v_color.b > 0.99) {
    outputColor = v_color;
    return;
  }

    // Skybox
  if(v_color.r == 0.0 && v_color.g == 0.0 && v_color.b == 0.0) {
    //   outputColor = vec4(0.4, 0.8, 0.97, 1.0); // blue
    outputColor = vec4(0.3, 0.1, 0.03, 1.0); // dark red
    return;
  }

  vec3 textureColor = v_color.rgb;

  // Lava
  if(v_color.r < 0.1 && v_color.g < 0.1 && v_color.b < 0.1) {
    // Based on: https://www.shadertoy.com/view/WdKcRt
    // Created by jarble in 2020-10-23
    vec2 lava_col = vec2(0.5, 0.5);
    float lava_t = u_time * .02;
    vec2 lava_uv = (v_position.xz) / 40.0 + vec2(lava_t, lava_t * 2.0);
    float lava_factor = 1.5;
    for(int lava_i = 0; lava_i < 12; lava_i++) {
      lava_uv *= -lava_factor * lava_factor;
      vec2 lava_v1 = lava_uv.yx / lava_factor;
      lava_uv += sin(lava_v1 + lava_col + lava_t * 10.0) / lava_factor;
      lava_col += vec2(sin(lava_uv.x - lava_uv.y + lava_v1.x - lava_col.y), sin(lava_uv.y - lava_uv.x + lava_v1.y - lava_col.x));
    }
    outputColor = vec4(vec3(lava_col.x + 4.0, lava_col.x - lava_col.y / 2.0, lava_col.x / 5.0) / 8.0, 1.0);
    return;
    // textureColor = vec3(col.x + 4.0, col.x - col.y / 2.0, col.x / 5.0) / 8.0;
    // textureColor = vec3(1.0, 0.0, 1.0);
  }

  // The majority of this shader is calculating light.
  // There are 4 inputs to lighting:
  // 1) Ambient - permeates the scene, not affected by direction
  // 2) Directional - light emmitted from the light source
  // 3) Specular refleciton - light bouncing directly into the camera
  //    See: http://learnwebgl.brown37.net/09_lights/lights_specular.html
  // 4) Shadows
  //    See: https://webgl2fundamentals.org/webgl/lessons/webgl-shadows.html

  // First we need to calculate the surface normal
  // We use the fragment deltas to infer the normal
  // This is a pretty GPU-inefficient way to do it,
  // but it's a small amount of code
  vec3 surfaceNormal = normalize(cross(dFdx(v_position.xyz), dFdy(v_position.xyz)));

  // Shadow mapping
  // Project this fragment onto the shadow map
  vec3 projectedTexcoord = v_shadowMapTexCoord.xyz / v_shadowMapTexCoord.w;

  // The current depth (from the perspective of the light source)
  // is simply the z value of the projected coordinate.
  // Subtract a small "bias" to reduce "shadow acne"
  // float bias = 0.0001;
  // float currentDepth = projectedTexcoord.z - bias;
  float currentDepth = projectedTexcoord.z * 0.9999995;

  // Make sure the projected coordinate is actually within range of the shadow map
  bool inRange = projectedTexcoord.x >= 0.0 &&
    projectedTexcoord.x <= 1.0 &&
    projectedTexcoord.y >= 0.0 &&
    projectedTexcoord.y <= 1.0;
  float projectedCount = 0.0;
  float closerCount = 0.0;

  for(float projectedY = -3.0; projectedY <= 3.0; projectedY += 1.0) {
    for(float projectedX = -3.0; projectedX <= 3.0; projectedX += 1.0) {
      // Get the projected depth
      // (If out of range, this willy simply clamp to edge)
      vec4 projectedPixel = texture(u_depthTexture, projectedTexcoord.xy + vec2(projectedX, projectedY) / 2048.0);
      float projectedDepth = projectedPixel.r;
      if(projectedDepth <= currentDepth) {
        closerCount += 1.0;
      }
      projectedCount += 1.0;
    }
  }

  // And now we can determine if we're in a shadow or not
  // If in a shadow, the shadow light is zero
  // Otherwise, the shadow light is one
  // float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.2 : 1.0;
  float shadowLight = inRange ? 1.0 - closerCount / projectedCount : 1.0;

  // Directional light
  vec3 lightNormal = normalize(vec3(-.25, -.75, .2));
  // float directionalLight = max(dot(surfaceNormal, lightNormal), 0.0);
  float directionalLight = 0.0;

  // Add additional lights
  for(int light = 0; light < 1; light++) {
    vec3 lightRay = v_position.xyz - u_lightPositions[light];
    float lightDistance = length(lightRay);
    // float lightRadius = 100.0;
    // float lightAttenuation = clamp(lightRadius / (lightDistance * lightDistance), 0.0, 1.0);
    float lightAttenuation = 1.0 / (1.0 + 0.1 * lightDistance + 0.01 * lightDistance * lightDistance);
    // surfaceColor.rgb += max(0.0, dot(normalize(lightRay), surfaceNormal)) * lightAttenuation * u_lightColors[light];
    directionalLight += 3.0 * max(0.0, dot(normalize(lightRay), surfaceNormal)) * lightAttenuation;
  }

  // Specular light
  // vec3 reflectionNormal = lightNormal - 2.0 * dot(lightNormal, surfaceNormal) * surfaceNormal;
  vec3 reflectionNormal = reflect(lightNormal, surfaceNormal);
  // vec3 cameraNormal = normalize(vec3(1, 0, -1));
  // vec3 cameraNormal = normalize(vec3(-1, 0, 1));
  // vec3 cameraNormal = normalize(vec3(0, 0, 1));
  vec3 cameraNormal = normalize(u_cameraPosition - v_position.xyz);
  float shininess = 8.0;
  // float specular = 10.0 * pow(clamp(dot(reflectionNormal, cameraNormal), 0.0, 100.0), shininess);
  float specular = 0.0;

  // Now sum up all of the component light sources
  // Total light should be in the range of 0.0 to 1.0
  float totalLight = 0.2 + 0.8 * directionalLight * shadowLight;
  // float totalLight = directionalLight * shadowLight;

  // Light factor can be in the range of 0.0 to 2.0
  // Apply toon shading / cel shading effect
  float lightFactor = clamp(totalLight + shadowLight * specular, 0.0, 1.0);
  // float lightFactor = totalLight + shadowLight * specular;

  // Toon shading
  // lightFactor = 0.33 * round(3.0 * lightFactor);
  // lightFactor = smoothstep(0.4, 0.6, lightFactor);

  // Now map the light factor to a color
  // Light factor 0-1 is black to color
  // vec3 surfaceColor = mix(vec3(0.1, 0.2, 0.2), textureColor, lightFactor);
  vec3 surfaceColor = mix(vec3(0.0, 0.0, 0.0), textureColor, lightFactor);

  // // Add additional lights
  // for (int light = 0; light < 16; light++) {
  //     vec3 lightRay = v_position.xyz - u_lightPositions[light];
  //     float lightDistance = length(lightRay);
  //     // float lightRadius = 100.0;
  //     // float lightAttenuation = clamp(lightRadius / (lightDistance * lightDistance), 0.0, 1.0);
  //     float lightAttenuation = 1.0 / (1.0 + 0.1 * lightDistance + 0.01 * lightDistance * lightDistance);
  //     surfaceColor.rgb += max(0.0, dot(normalize(lightRay), surfaceNormal)) * lightAttenuation * u_lightColors[light];
  // }

  // outputColor.rgb = surfaceColor.rgb;
  // 0x4b0e00 = 0.3, 0.05, 0.0
  // float fogAmount = v_position.z;
  outputColor.rgb = mix(surfaceColor.rgb, vec3(0.3, 0.05, 0.0), clamp(v_fogDistance * 0.005, 0.0, 1.0));
  // outputColor.rgb = mix(surfaceColor.rgb, vec3(1.0, 1.0, 1.0), 0.5);
  outputColor.a = 1.0;
}
