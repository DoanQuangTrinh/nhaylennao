/**
 * img2threejs + GLB model integration for Neon Club Live
 * ------------------------------------------------------
 * Skill: `.grok/skills/img2threejs/`
 *
 * Character factories:
 *   createModelCharacter  — unified (GLB → fashion → photo)
 *   createGlbCharacter    — skinned Soldier / Xbot / Robot
 *   createFashionCharacter — procedural multi-part human
 *   createPhotoCharacter  — AI full-body billboard
 *
 * Models: public/models/*.glb
 * AI refs: public/chars/*.jpg
 */

export * from "./runtime";
export * from "./materials";
export * from "./createHumanCharacter";
export * from "./createFashionCharacter";
export * from "./createVenueProps";
export * from "./createGlbCharacter";
export * from "./createPhotoCharacter";
export * from "./createModelCharacter";
