import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

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

  return <primitive object={battleGround.scene} />;
};

useGLTF.preload("models/map.glb");

export default BattleGround;
