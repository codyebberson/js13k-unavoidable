#version 300 es

precision mediump float;

// Position attribute
// Represents a position on the geometry
// In the original unit-space
in vec4 a_position;

// Color attribute.
// The raw color is passed in as a 32-bit unsigned integer /
// 4 unsigned bytes.
in vec4 a_color;

// World transformation matrix
// One matrix per instance
in mat4 a_worldMatrix;

uniform vec3 u_focusPosition;

// Camera projection uniform
uniform mat4 u_projectionMatrix;

// Camera view uniform
uniform mat4 u_viewMatrix;

// Shadow map transformation matrix
// Transforms from world coordinates to shadow map coordinates
uniform mat4 u_shadowMapMatrix;

// World position
// Mesh position transformed to world position
out vec4 v_position;

// Color varying
// Simple copy of the input color
out vec4 v_color;

// Fog distance
out float v_fogDistance;

// Projected texture coordinate on the shadow map
out vec4 v_shadowMapTexCoord;

void main() {
    v_position = a_worldMatrix * a_position;
    v_color = a_color;

    // Linearize the depth
    // Make sure these values are the same as in camera setup.
    float zNear = 0.1;
    float zFar = 1000.0;
    // v_fogDistance = zNear / (zFar + -(u_viewMatrix * v_position).z * (zNear - zFar));
    // v_fogDistance = -(u_viewMatrix * v_position).z;

    v_shadowMapTexCoord = u_shadowMapMatrix * v_position;
    gl_Position = u_projectionMatrix * u_viewMatrix * v_position;
    
    // v_fogDistance = zNear / (zFar + gl_Position.z * (zNear - zFar));
    // v_fogDistance = 1.0;
    // v_fogDistance = gl_Position.z;
    v_fogDistance = distance(u_focusPosition, v_position.xyz);
}
