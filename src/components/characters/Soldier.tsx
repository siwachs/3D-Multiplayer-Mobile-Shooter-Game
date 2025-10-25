import { useEffect, useMemo, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { useGraph } from "@react-three/fiber";
import { Color, LoopOnce, Mesh, MeshStandardMaterial } from "three";

import type { GLTF } from "three-stdlib";
import type { Object3D, SkinnedMesh, Material, Group } from "three";

export interface SoldierGLTF extends GLTF {
  nodes: {
    Root: Object3D;
    Body: Object3D;
    Head: Object3D;
    Cube004: SkinnedMesh;
    Cube004_1: SkinnedMesh;
    Cube004_2: SkinnedMesh;
    Cube004_3: SkinnedMesh;
    Cube004_4: SkinnedMesh;

    // weapons
    AK?: Object3D;
    GrenadeLauncher?: Object3D;
    Knife_1?: Object3D;
    Knife_2?: Object3D;
    Pistol?: Object3D;
    Revolver?: Object3D;
    Revolver_Small?: Object3D;
    RocketLauncher?: Object3D;
    ShortCannon?: Object3D;
    SMG?: Object3D;
    Shotgun?: Object3D;
    Shovel?: Object3D;
    Sniper?: Object3D;
    Sniper_2?: Object3D;

    [key: string]: any; // fallback
  };
  materials: {
    Skin: Material;
    DarkGrey: Material;
    Pants: Material;
    Black: Material;
    Character_Main?: Material;
    [key: string]: Material | undefined;
  };
}

const WEAPONS = [
  "GrenadeLauncher",
  "AK",
  "Knife_1",
  "Knife_2",
  "Pistol",
  "Revolver",
  "Revolver_Small",
  "RocketLauncher",
  "ShortCannon",
  "SMG",
  "Shotgun",
  "Shovel",
  "Sniper",
  "Sniper_2",
];

// GLTF to jsx -> https://gltf.pmnd.rs
export default function Soldier({
  color = "black",
  animation = "Ideal",
  weapon = "AK",
  ...props
}: Readonly<{ color?: string; animation?: string; weapon?: string }>) {
  const group = useRef<Group>(null!);
  const { scene, materials, animations } = useGLTF(
    "/models/Character_Soldier.gltf"
  ) as SoldierGLTF;

  // Skinned meshes cannot be re-used in threejs without cloning them
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  // useGraph creates two flat object collections for nodes and material
  const { nodes } = useGraph(clone) as unknown as {
    nodes: SoldierGLTF["nodes"];
  };

  const { actions } = useAnimations(animations, group);
  if (actions["Death"]) {
    actions["Death"].loop = LoopOnce;
    actions["Death"].clampWhenFinished = true;
  }

  useEffect(() => {
    actions[animation]?.reset().fadeIn(0.2).play();

    return () => {
      actions[animation]?.fadeOut(0.2);
    };
  }, [animation]);

  const playerColorMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(color),
      }),
    [color]
  );

  useEffect(() => {
    // HIDING NON-SELECTED WEAPONS
    for (const wp of WEAPONS) {
      const isCurrentWeapon = wp === weapon;
      nodes[wp].visible = isCurrentWeapon;
    }

    // ASSIGNING CHARACTER COLOR
    nodes.Body.traverse((child) => {
      if (child instanceof Mesh && child.material.name === "Character_Main") {
        child.material = playerColorMaterial;
      }

      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    nodes.Head.traverse((child) => {
      if (child instanceof Mesh && child.material.name === "Character_Main") {
        child.material = playerColorMaterial;
      }
    });

    clone.traverse((child) => {
      if (child instanceof Mesh && child.material.name === "Character_Main") {
        child.material = playerColorMaterial;
      }

      if (child instanceof Mesh) {
        child.castShadow = true;
      }
    });
  }, [nodes, clone]);

  return (
    <group {...props} dispose={null} ref={group}>
      <group name="Scene">
        <group name="CharacterArmature">
          <primitive object={nodes.Root} />
          <group name="Body_1">
            <skinnedMesh
              name="Cube004"
              geometry={nodes.Cube004.geometry}
              material={materials.Skin}
              skeleton={nodes.Cube004.skeleton}
              castShadow
            />
            <skinnedMesh
              name="Cube004_1"
              geometry={nodes.Cube004_1.geometry}
              material={materials.DarkGrey}
              skeleton={nodes.Cube004_1.skeleton}
              castShadow
            />
            <skinnedMesh
              name="Cube004_2"
              geometry={nodes.Cube004_2.geometry}
              material={materials.Pants}
              skeleton={nodes.Cube004_2.skeleton}
              castShadow
            />
            <skinnedMesh
              name="Cube004_3"
              geometry={nodes.Cube004_3.geometry}
              material={playerColorMaterial}
              skeleton={nodes.Cube004_3.skeleton}
              castShadow
            />
            <skinnedMesh
              name="Cube004_4"
              geometry={nodes.Cube004_4.geometry}
              material={materials.Black}
              skeleton={nodes.Cube004_4.skeleton}
              castShadow
            />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/Character_Soldier.gltf");
