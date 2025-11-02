import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

import { RigidBody } from "@react-three/rapier";
import { Mesh } from "three";

const BattleGround = () => {
  const battleGround = useGLTF("models/map.glb");

  useEffect(() => {
    battleGround.scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [battleGround.scene]);

  return (
    <RigidBody colliders="trimesh" type="fixed">
      <primitive object={battleGround.scene} />
    </RigidBody>
  );
};

useGLTF.preload("models/map.glb");

export default BattleGround;
