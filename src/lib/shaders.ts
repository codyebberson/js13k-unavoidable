// Autogenerated by shadermin.js
// Do not modify manually

export const ATTRIBUTE_COLOR = 'a';
export const ATTRIBUTE_POSITION = 'b';
export const ATTRIBUTE_TEXCOORD = 'c';
export const ATTRIBUTE_WORLDMATRIX = 'd';
export const UNIFORM_BLOOMTEXTURE = 'f';
export const UNIFORM_CAMERAPOSITION = 'g';
export const UNIFORM_COLORTEXTURE = 'h';
export const UNIFORM_DEPTHTEXTURE = 'i';
export const UNIFORM_FOCUSFAR = 'j';
export const UNIFORM_FOCUSNEAR = 'k';
export const UNIFORM_FOCUSPOSITION = 'l';
export const UNIFORM_ITERATION = 'm';
export const UNIFORM_LIGHTCOLORS = 'n';
export const UNIFORM_LIGHTPOSITIONS = 'o';
export const UNIFORM_PROJECTIONMATRIX = 'p';
export const UNIFORM_SHADOWMAPMATRIX = 'q';
export const UNIFORM_TIME = 'r';
export const UNIFORM_VIEWMATRIX = 's';

const GLSL_PREFIX =
  '#version 300 es\n' +
  'precision mediump float;';

export const BLOOM_FRAG =
  GLSL_PREFIX +
  'uniform sampler2D h;' +
  'uniform int m;' +
  'in vec2 x;' +
  'out vec4 e;' +
  'float B=0.99;' +
  'float C[11]=float[11](0.01,0.02,0.04,0.08,0.16,0.38,0.16,0.08,0.04,0.02,0.01);' +
  'void main(){' +
  'if(m==0){' +
  'vec4 y=texture(h,x);' +
  'if(y.r>B||y.g>B||y.b>B){' +
  'e=y;' +
  '}' +
  'else{' +
  'discard;' +
  '}' +
  '}' +
  'else if(m==1||m==3){' +
  'vec4 z=vec4(0);' +
  'float A=0.0;' +
  'for(int xi=-5;' +
  'xi<=5;' +
  'xi++){' +
  'vec4 y=texture(h,x+vec2(float(xi)/512.0,0.0));' +
  'z.rgb+=C[xi+5]*y.rgb*y.a;' +
  'A+=C[xi+5]*y.a;' +
  '}' +
  'if(A==0.0){' +
  'e=vec4(0,0,0,1);' +
  '}' +
  'else{' +
  'z.rgb/=A;' +
  'z.a=A;' +
  'e=z;' +
  '}' +
  '}' +
  'else{' +
  'vec4 z=vec4(0);' +
  'float A=0.0;' +
  'for(int yi=-5;' +
  'yi<=5;' +
  'yi++){' +
  'vec4 y=texture(h,x+vec2(0.0,float(yi)/512.0));' +
  'z.rgb+=C[yi+5]*y.rgb*y.a;' +
  'A+=C[yi+5]*y.a;' +
  '}' +
  'if(A==0.0){' +
  'e=vec4(0,0,0,1);' +
  '}' +
  'else{' +
  'z.rgb/=A;' +
  'z.a=A;' +
  'e=z;' +
  '}' +
  '}' +
  '}';

export const BLOOM_VERT =
  GLSL_PREFIX +
  'in vec2 b;' +
  'in vec2 c;' +
  'out vec2 x;' +
  'void main(){' +
  'gl_Position=vec4(b,0,1);' +
  'x=c;' +
  '}';

export const MAIN_FRAG =
  GLSL_PREFIX +
  'uniform float r;' +
  'uniform vec3 g;' +
  'uniform sampler2D i;' +
  'uniform vec3 o[16];' +
  'uniform vec3 n[16];' +
  'in vec4 t;' +
  'in float u;' +
  'in vec4 v;' +
  'in vec4 w;' +
  'out vec4 e;' +
  'void main(){' +
  'if(t.r>0.99||t.g>0.99||t.b>0.99){' +
  'e=t;' +
  'return;' +
  '}' +
  'if(t.r==0.0&&t.g==0.0&&t.b==0.0){' +
  'e=vec4(0.3,0.1,0.03,1.0);' +
  'return;' +
  '}' +
  'if(t.r<0.1&&t.g<0.1&&t.b<0.1){' +
  'vec2 D=vec2(0.5,0.5);' +
  'float F=r*.02;' +
  'vec2 G=(v.xz)/40.0+vec2(F,F*2.0);' +
  'float E=1.5;' +
  'for(int lava_i=0;' +
  'lava_i<12;' +
  'lava_i++){' +
  'G*=-E*E;' +
  'vec2 H=G.yx/E;' +
  'G+=sin(H+D+F*10.0)/E;' +
  'D+=vec2(sin(G.x-G.y+H.x-D.y),sin(G.y-G.x+H.y-D.x));' +
  '}' +
  'e=vec4(vec3(D.x+4.0,D.x-D.y/2.0,D.x/5.0)/8.0,1.0);' +
  'return;' +
  '}' +
  'vec3 Y=normalize(cross(dFdx(v.xyz),dFdy(v.xyz)));' +
  'vec3 Q=w.xyz/w.w;' +
  'float N=0.0;' +
  'float z=0.0;' +
  'for(float S=-3.0;' +
  'S<=3.0;' +
  'S+=1.0){' +
  'for(float R=-3.0;' +
  'R<=3.0;' +
  'R+=1.0){' +
  'if(((texture(i,Q.xy+vec2(R,S)/2048.0)).r)<=(Q.z*0.9999995)){' +
  'z+=1.0;' +
  '}' +
  'N+=1.0;' +
  '}' +
  '}' +
  'float U=(Q.x>=0.0&&Q.x<=1.0&&Q.y>=0.0&&Q.y<=1.0)?1.0-z/N:1.0;' +
  'float B=0.0;' +
  'for(int light=0;' +
  'light<1;' +
  'light++){' +
  'vec3 M=v.xyz-o[light];' +
  'float J=length(M);' +
  'B+=3.0*max(0.0,dot(normalize(M),Y))*(1.0/(1.0+0.1*J+0.01*J*J));' +
  '}' +
  'vec3 T=reflect((normalize(vec3(-.25,-.75,.2))),Y);' +
  'vec3 y=normalize(g-v.xyz);' +
  'float V=8.0;' +
  'e.rgb=mix((mix(vec3(0.0,0.0,0.0),(t.rgb),(clamp((0.2+0.8*B*U)+U*(0.0),0.0,1.0)))).rgb,vec3(0.3,0.05,0.0),clamp(u*0.005,0.0,1.0));' +
  'e.a=1.0;' +
  '}';

export const MAIN_VERT =
  GLSL_PREFIX +
  'in vec4 b;' +
  'in vec4 a;' +
  'in mat4 d;' +
  'uniform vec3 l;' +
  'uniform mat4 p;' +
  'uniform mat4 s;' +
  'uniform mat4 q;' +
  'out vec4 v;' +
  'out vec4 t;' +
  'out float u;' +
  'out vec4 w;' +
  'void main(){' +
  'v=d*b;' +
  't=a;' +
  'float z=0.1;' +
  'float y=1000.0;' +
  'w=q*v;' +
  'gl_Position=p*s*v;' +
  'u=distance(l,v.xyz);' +
  '}';

export const POST_FRAG =
  GLSL_PREFIX +
  'uniform sampler2D h;' +
  'uniform sampler2D i;' +
  'uniform sampler2D f;' +
  'uniform float k;' +
  'uniform float j;' +
  'in vec2 x;' +
  'out vec4 e;' +
  'void main(){' +
  'float O=0.1;' +
  'float N=1000.0;' +
  'float F=O/(N+(texture(i,x).r)*(O-N));' +
  'vec4 C=texture(h,x);' +
  'float L=1.0;' +
  'for(float M=0.0;' +
  'M<6.28;' +
  'M+=0.6){' +
  'vec2 I=x+(clamp((max((max(0.0,5.0*(k/N-F))),(max(0.0,0.1*(F-j/N)))))*(0.1),0.0,(0.03)))*vec2(cos(M),sin(M));' +
  'if((O/(N+(texture(i,I).r)*(O-N)))>=F-0.1){' +
  'C+=texture(h,I);' +
  'L+=1.0;' +
  '}' +
  '}' +
  'vec4 y=texture(f,x);' +
  'e=vec4(C.rgb/L+2.0*y.a*y.rgb,1);' +
  '}';

export const POST_VERT =
  GLSL_PREFIX +
  'in vec2 b;' +
  'in vec2 c;' +
  'out vec2 x;' +
  'void main(){' +
  'gl_Position=vec4(b,0,1);' +
  'x=c;' +
  '}';

export const SHADOW_FRAG =
  GLSL_PREFIX +
  'out vec4 e;' +
  'void main(){' +
  'e=vec4(1,1,1,1);' +
  '}';

export const SHADOW_VERT =
  GLSL_PREFIX +
  'in vec4 b;' +
  'in mat4 d;' +
  'uniform mat4 p;' +
  'uniform mat4 s;' +
  'void main(){' +
  'gl_Position=p*s*d*b;' +
  '}';
